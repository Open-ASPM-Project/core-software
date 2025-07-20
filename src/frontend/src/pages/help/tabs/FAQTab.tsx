import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Mail, MessagesSquare } from 'lucide-react';

// FAQ data
const faqData = [
  {
    question: 'What does the Dashboard page show?',
    answer:
      "The Dashboard provides a real-time overview of your security posture, including incident trends, asset status, and remediation progress. It's your at-a-glance view of your overall security health.",
  },
  {
    question: "What's the difference between PR Scans and Commit Scans?",
    answer:
      'PR Scans analyze code in pull requests before merging, helping catch issues early. Commit Scans continuously monitor direct commits to your main codebase, ensuring immediate detection of security issues after code is merged.',
  },
  {
    question: 'How do I manage false positives in secret detection?',
    answer:
      'Use the Allowlisted Secrets page to manage known false positives. You can add secrets that are approved for use, which prevents them from triggering alerts in future scans.',
  },
  {
    question: 'How does the Incidents Kanban board work?',
    answer:
      "The Incidents page features a Kanban board for easy tracking of security issues. You can drag and drop incidents between columns (e.g., 'To Do', 'In Progress', 'Done') to update their status and manage your security workflow.",
  },
  {
    question: 'How quickly are new vulnerabilities detected after a commit?',
    answer:
      'Our real-time scanning process typically detects and reports new vulnerabilities within minutes of a commit or pull request being created. The exact time may vary based on the size and complexity of the changes.',
  },
  {
    question: 'Can I customize the severity levels of different types of security issues?',
    answer:
      "Yes, you can customize severity levels for different issue types. Navigate to the Incidents page, find the 'Issue Severity' button in the incidents detailed view, and you can adjust the severity levels according to your organization's risk tolerance.",
  },
  {
    question: 'How do I configure my Version Control System (VCS) for real-time scanning?',
    answer: (
      <>
        To set up real-time scanning for your VCS, follow these steps:
        <ol className="list-decimal ml-4 mt-2 space-y-1">
          <li>Navigate to the Settings Page</li>
          <li>Select "Configurations"</li>
          <li>Click on "Add"</li>
          <li>Select VC type and add your VCS token or API key</li>
          <li>
            Save your changes, the platform will start scanning your repositories in real-time.
          </li>
        </ol>
      </>
    ),
  },
  {
    question: 'How do I configure Slack alerts?',
    answer: (
      <>
        To set up Slack alerts for your security notifications, follow these steps:
        <ol className="list-decimal ml-4 mt-2 space-y-1">
          <li>Navigate to the Settings Page</li>
          <li>Select "Alerts"</li>
          <li>Look for the Slack icon and click configure</li>
          <li>Add your Slack token and other required details (like channel names)</li>
          <li>
            Save your settings. Once configured, you'll start receiving security alerts in your
            specified Slack channels.
          </li>
        </ol>
      </>
    ),
  },
  {
    question: 'What are the different user roles available in the platform?',
    answer: (
      <>
        Our platform offers three user roles:
        <ol className="list-decimal ml-4 mt-2 space-y-1">
          <li>
            <strong>Admin:</strong> Full access to all features, including user management and
            platform configuration.
          </li>
          <li>
            <strong>Security:</strong> Access to all security features but cannot manage users or
            change platform settings.
          </li>
          <li>
            <strong>Read-only:</strong> Can view data and reports but cannot make changes or manage
            incidents.
          </li>
        </ol>
      </>
    ),
  },
];

const FAQTab = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
        <p className="text-muted-foreground">
          Here you can find some helpful answers to frequently asked questions (FAQ).
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="default"
            onClick={() => window.open('mailto:support@thefirewall.org')}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Email us your question
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open('https://discord.gg/jD2cEy2ugg', '_blank')}
            className="gap-2"
          >
            <MessagesSquare className="h-4 w-4" />
            Join Our Discord
          </Button>
        </div>
      </div>

      {/* FAQ Accordion */}
      <Card>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQTab;
