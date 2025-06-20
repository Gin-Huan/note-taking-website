import { Note } from '@/lib/types/note';

export const sampleNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to NotesApp',
    content: `# Welcome to NotesApp! 🎉

This is your personal note-taking space where you can:

## Features
- **Markdown Support**: Write with full markdown formatting
- **Search & Filter**: Find your notes instantly
- **Categories & Tags**: Organize your thoughts
- **Dark/Light Mode**: Work comfortably in any lighting

## Getting Started
1. Click the "+" button to create a new note
2. Use markdown syntax for rich formatting
3. Tag your notes for better organization
4. Use the search bar to find specific content

## Markdown Examples

### Code Blocks
\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

### Lists
- [x] Set up note-taking app
- [ ] Write more notes
- [ ] Organize with tags

### Links and Images
Check out [Markdown Guide](https://www.markdownguide.org/) for more formatting options.

---

**Happy note-taking!** ✍️`,
    tags: ['welcome', 'tutorial', 'markdown'],
    category: 'general',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    isPinned: true,
    color: '#3B82F6',
  },
  {
    id: '2',
    title: 'Project Ideas',
    content: `# Project Ideas 💡

## Web Development
- [ ] Personal portfolio website
- [ ] E-commerce platform
- [ ] Task management app
- [ ] Weather dashboard
- [ ] Recipe sharing platform

## Mobile Apps
- [ ] Expense tracker
- [ ] Habit tracker
- [ ] Language learning app
- [ ] Fitness companion

## Data Science
- [ ] Stock price predictor
- [ ] Movie recommendation system
- [ ] Sentiment analysis tool
- [ ] Customer segmentation

## Fun Projects
- [ ] Discord bot
- [ ] Chrome extension
- [ ] Game with JavaScript
- [ ] Art generator with AI

---
*Remember: Start small, think big!*`,
    tags: ['ideas', 'projects', 'development'],
    category: 'work',
    createdAt: new Date('2024-01-14T15:30:00Z'),
    updatedAt: new Date('2024-01-16T09:15:00Z'),
    isPinned: false,
    color: '#10B981',
  },
  {
    id: '3',
    title: 'Daily Standup Notes',
    content: `# Daily Standup - January 16, 2024

## Yesterday's Accomplishments
- ✅ Completed user authentication module
- ✅ Fixed critical bug in payment processing
- ✅ Code review for team member's PR

## Today's Goals
- 🎯 Implement note-taking app frontend
- 🎯 Set up CI/CD pipeline
- 🎯 Team meeting at 2 PM

## Blockers
- Waiting for API documentation from backend team
- Need access to staging environment

## Notes
- Consider using React Query for data fetching
- Discuss architecture decisions in next team meeting`,
    tags: ['standup', 'work', 'daily'],
    category: 'work',
    createdAt: new Date('2024-01-16T08:00:00Z'),
    updatedAt: new Date('2024-01-16T08:00:00Z'),
    isPinned: false,
    color: '#F59E0B',
  },
  {
    id: '4',
    title: 'Learning Resources',
    content: `# Learning Resources 📚

## Frontend Development
- **React Documentation**: Official React docs with hooks
- **TypeScript Handbook**: Comprehensive TS guide
- **Next.js Learn**: Interactive Next.js tutorial
- **Tailwind CSS**: Utility-first CSS framework

## Backend Development
- **Node.js Best Practices**: Security and performance tips
- **PostgreSQL Tutorial**: Database fundamentals
- **API Design Guide**: RESTful API principles

## Tools & Productivity
- **VS Code Extensions**: Must-have extensions list
- **Git Workflow**: Branching strategies and best practices
- **Docker Basics**: Containerization fundamentals

## Bookmarks
- [JavaScript.info](https://javascript.info/) - Modern JS tutorial
- [MDN Web Docs](https://developer.mozilla.org/) - Web technologies reference
- [GitHub Awesome Lists](https://github.com/sindresorhus/awesome) - Curated lists

---
*Knowledge is power, but applied knowledge is everything.*`,
    tags: ['learning', 'resources', 'development'],
    category: 'personal',
    createdAt: new Date('2024-01-12T11:20:00Z'),
    updatedAt: new Date('2024-01-15T14:45:00Z'),
    isPinned: false,
    color: '#8B5CF6',
  },
];