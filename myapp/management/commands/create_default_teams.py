from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from myapp.models import Teams

class Command(BaseCommand):
    help = 'Creates default teams for the application'

    def handle(self, *args, **kwargs):
        # Create a superuser if it doesn't exist
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin')
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        admin_user = User.objects.get(username='admin')

        # Create default teams
        default_teams = [
            {'name': 'Android Team', 'type': 'Android'},
            {'name': 'Web Team', 'type': 'Web'},
        ]

        for team in default_teams:
            Teams.objects.get_or_create(
                team_name=team['name'],
                defaults={
                    'team_type': team['type'],
                    'team_manager': admin_user
                }
            )
            self.stdout.write(self.style.SUCCESS(f'Created team {team["name"]}')) 