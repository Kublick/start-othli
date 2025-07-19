Shadcn MCP Budgeting App - UX Structure Plan
Navigation Structure

Page Structure & Components

1. Dashboard Page (/dashboard)
   Layout Components

Header Section

Welcome message with user name
Quick action buttons (Add Transaction, Create Budget)
Notification bell with activity count

Overview Cards Row

Total Balance Card (current month)
Monthly Income Card
Monthly Expenses Card
Shared Expenses Card (if applicable)

Quick Actions Panel

"Add Expense" button
"Add Income" button
"Invite Partner" button (if no shared budget)

Recent Activity Feed

Last 10 transactions
Shared budget activities
Pending invitations/approvals

Charts Section

Monthly expense trends (line chart)
Category breakdown (pie chart)
Budget vs actual (progress bars)

2. Profile Page (/profile)
   Profile Overview Section

Profile Header

Avatar (upload/change photo)
User name and email (from better-auth)
Member since date
Profile completion percentage

Profile Settings Tabs

Personal Info Tab

Full name input
Phone number input
Preferred currency (default MXN)
Timezone selection
Language preference

Financial Preferences Tab

Default budget categories
Expense notification thresholds
Monthly budget alerts toggle
Automatic categorization preferences

Privacy & Sharing Tab

Profile visibility settings
Data sharing preferences
Activity visibility controls
Shared budget permissions

Security Tab

Change password (if using email/password)
Two-factor authentication
Active sessions management
Account deletion option

Notifications Tab

Email notifications toggle
Push notifications (if PWA)
Budget alerts settings
Shared activity notifications

3. Budgets Page (/budgets)
   Budgets Overview

Page Header

"Create Budget" button
Budget filters (Personal/Shared/All)
Search bar for budget names

Budget Cards Grid

Personal Budget Cards

Budget name and period
Progress bar (spent/total)
Quick stats (remaining, spent)
"View Details" button

Shared Budget Cards

Budget name and collaborators
Your contribution percentage
Balance status indicator
"Manage" button

Create Budget Modal

Budget Setup Form

Budget name input
Budget type (Personal/Shared)
Budget period (Monthly/Weekly/Custom)
Total budget amount
Categories and limits setup

Sharing Configuration (for shared budgets)

Invite user input (email)
Split ratio selector (50/50, 60/40, custom)
Permission levels (View/Edit/Manage)

4. Budget Details Page (/budgets/[id])
   Budget Header

Budget name and edit button
Period selector (current/previous months)
Budget progress indicator
Share/Invite button

Main Content Areas

Budget Summary Cards

Total budget vs spent
Your allocated amount (for shared)
Your actual contribution
Balance status

Category Breakdown

Category cards with progress bars
Spent/Budget/Remaining for each
Quick "Add Transaction" per category

Split Overview (for shared budgets)

Visual split representation
Each member's contribution
Balance owed/owing status
Settlement suggestions

Recent Transactions

Transactions table for this budget
Filter by category/member
Quick edit/delete actions

5. Transactions Page (/transactions)
   Transactions Header

"Add Transaction" button
Export options dropdown
Date range picker
Search and filters panel

Transactions Table

Table Columns

Date
Description
Category
Amount (income/expense indicator)
Budget (if applicable)
Actions (edit/delete)

Table Features

Sortable columns
Pagination
Bulk selection for actions
Row hover with quick actions

Add Transaction Modal

Transaction Form

Type selector (Income/Expense)
Amount input (MXN currency)
Description input
Category selector
Date picker
Budget assignment
Receipt upload option

Recurring Transaction Setup

Frequency selector
End date option
Auto-categorization

6. Categories Page (/categories)
   Categories Management

Page Header

"Create Category" button
Category type filter (Income/Expense)
Search categories

Categories Grid

Category Cards

Category name and icon
Category color indicator
Transaction count
Total spent this month
Edit/Delete actions

Create/Edit Category Modal

Category name input
Icon picker
Color picker
Category type (Income/Expense)
Default budget assignment
Description field

7. Shared Budgets Page (/shared)
   Shared Budgets Overview

Active Shared Budgets

Budget cards with collaboration info
Your role indicator
Recent activity preview

Pending Invitations

Incoming invitations list
Accept/Decline actions
Invitation details preview

Member Management (for budget owners)

Current members list
Permission management
Invite new members
Remove members option

Shared Budget Details

Collaboration Panel

Member avatars and names
Activity timeline
Comments on transactions
Split balance visualization

Split Calculator

Current split ratios
Adjust split percentages
Calculate individual amounts
Settlement recommendations

8. Settings Page (/settings)
   Settings Navigation

Account settings
Notification preferences
Privacy controls
Data management
Help & support

Account Settings

Profile information
Password management
Connected accounts
Subscription details (if applicable)

Mobile UX Considerations
Mobile Navigation

Bottom tab bar for main sections
Hamburger menu for secondary options
Swipe gestures for common actions

Mobile-Specific Features

Quick expense entry (floating button)
Voice input for transaction descriptions
Camera integration for receipts
Push notifications
Offline mode capability

Touch Interactions

Swipe to delete transactions
Pull to refresh lists
Long press for context menus
Touch-friendly button sizes (44px minimum)

Component States & Feedback
Loading States

Skeleton loaders for tables and cards
Progress indicators for data imports
Spinner overlays for form submissions

Error States

Inline form validation errors
Empty state illustrations
Network error messages
Retry action buttons

Success Feedback

Toast notifications for actions
Success animations for form submissions
Progress celebrations (budget goals)
Achievement badges

Responsive Breakpoints
Desktop (1024px+)

Full sidebar navigation
Multi-column layouts
Advanced data tables
Comprehensive forms

Tablet (768px - 1023px)

Collapsible sidebar
Adapted grid layouts
Touch-optimized controls
Contextual navigation

Mobile (< 768px)

Bottom navigation
Single-column layouts
Simplified forms
Gesture-based interactions

Accessibility Features
Visual Accessibility

High contrast mode support
Scalable font sizes
Color-blind friendly palette
Focus indicators

Interaction Accessibility

Keyboard navigation
Screen reader support
ARIA labels and roles
Skip navigation links

Content Accessibility

Clear heading hierarchy
Descriptive link text
Form labels and instructions
Error message clarity
