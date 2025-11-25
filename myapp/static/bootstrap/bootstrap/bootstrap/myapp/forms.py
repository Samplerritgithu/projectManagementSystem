from django import forms
from .models import FAQ

class FAQForm(forms.ModelForm):
    class Meta:
        model = FAQ
        fields = ['question','answer']

    # Example customization of specific fields
    question = forms.CharField(
        label='Your Question',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter your question here'}),
        max_length=200,
    )
    
    answer = forms.CharField(
        label='Answer',
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 5}),
        help_text='Provide a detailed answer to the question.',
    )

    # Optional: You can override clean methods for validation if needed
    def clean_question(self):
        question = self.cleaned_data.get('question')
        # Example validation: Ensure the question is not too short
        if len(question) < 10:
            raise forms.ValidationError("Question must be at least 10 characters long.")
        return question
