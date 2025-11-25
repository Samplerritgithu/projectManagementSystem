import json
import re
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.utils import timezone
from django.contrib.auth.models import User
from .models import ChatMessage, Room, Notification

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return

        # Get room name from URL
        incoming_room = self.scope['url_route']['kwargs']['room_name']
        self.room_name = "Group_Avsys" if incoming_room == "public" else incoming_room
        self.room_group_name = 'chat_' + re.sub(r'[^a-zA-Z0-9_\-\.]', '_', self.room_name)

        # Get or create the Room object
        self.room_obj = await self.get_or_create_room(self.room_name)

        # Add user to the channel layer group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Send all previous messages
        messages = await self.get_all_messages()
        for msg in messages:
            await self.send(text_data=json.dumps(msg))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        user = self.scope["user"]

        # Save the new message
        await self.save_message(user, message)

        # Broadcast the message to all clients in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': user.username,
                'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @sync_to_async
    def get_or_create_room(self, room_name):
        room, created = Room.objects.get_or_create(name=room_name)
        if created:
            room.room_type = 'public' if room_name == "Group_Avsys" else 'private'
            room.save()
        return room

    @sync_to_async
    def save_message(self, user, message):
        ChatMessage.objects.create(user=user, message=message, room=self.room_obj)

    @sync_to_async
    def get_all_messages(self):
        return [
            {
                'username': msg.user.username,
                'message': msg.message,
                'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for msg in ChatMessage.objects
                .filter(room=self.room_obj)
                .select_related('user')
                .order_by('timestamp')  # oldest messages first
        ]
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Notification


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get user from WebSocket scope
        self.user = self.scope["user"]
        print(f"Notification WebSocket connection attempt for user: {self.user}")
        print(f"User authenticated: {self.user.is_authenticated}")
        print(f"User ID: {self.user.id if self.user.is_authenticated else 'N/A'}")

        # Reject connection if user not logged in
        if not self.user.is_authenticated:
            print("User not authenticated, closing WebSocket")
            await self.close()
            return

        # Create a unique group name for this user's notifications
        self.user_group_name = f'notifications_{self.user.id}'
        print(f"User group name: {self.user_group_name}")

        # Add user to the channel layer group
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        await self.accept()

        # Send current notification count when connected
        count = await self.get_notification_count(self.user)
        print(f"Sending initial notification count: {count}")
        await self.send(text_data=json.dumps({
            "type": "notification_count",
            "count": count
        }))

    async def disconnect(self, close_code):
        # Only discard if group name exists (prevents AttributeError for anonymous users)
        if hasattr(self, "user_group_name"):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
        print(f"Notification WebSocket disconnected (code={close_code})")

    async def receive(self, text_data):
        # Currently no incoming messages expected from client
        pass

    # --- Aliases / Event handlers for notification updates ---
    async def notification_update(self, event):
        """
        Some parts of the system send a 'notification_update' event type.
        Delegate to send_notification() for consistent handling.
        """
        try:
            await self.send_notification(event)
        except Exception as e:
            print("Error handling notification_update:", e)
            await self.send(text_data=json.dumps({
                "type": "notification",
                "message": event.get("message", ""),
                "count": event.get("count", 0),
            }))

    async def notification(self, event):
        """Alias for type='notification' events."""
        await self.send_notification(event)

    async def send_notification(self, event):
        """Handles sending notification updates to the client."""
        print(f"Notification update received: {event}")
        await self.send(text_data=json.dumps({
            "type": "notification",
            "message": event.get("message", ""),
            "count": event.get("count", 0),
        }))

    @sync_to_async
    def get_notification_count(self, user):
        """Fetch unread notification count for a given user."""
        return Notification.objects.filter(user=user, read=False).count()
