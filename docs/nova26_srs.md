# Nova 26
# Software Requirements Specification (SRS)

## Document Information

**Project Name:** Nova 26  
**Project Type:** Student Productivity Application  
**Version:** 1.0  
**Developer:** Suraj Yadav  
**Development Platform:** GitHub Codespaces  

---

# 1. Introduction

## 1.1 Project Overview

Nova 26 is a personalized student productivity application designed to help students manage their academic activities from a single platform.

The application provides features such as schedule management, note creation, test record management, task organization, and useful student tools like a calculator.

Future versions of Nova 26 will include an AI-powered study assistant for problem-solving, personalized learning support, study planning, and academic guidance.

---

## 1.2 Purpose

The purpose of Nova 26 is to create an organized digital environment where students can manage their studies efficiently.

The application aims to reduce the need for multiple separate applications by combining important student tools into one platform.

---

## 1.3 Problem Statement

Students often use different applications for notes, schedules, reminders, and performance tracking.

Managing information across multiple platforms can become difficult and time-consuming.

Nova 26 solves this problem by providing a single personalized application for academic management.

---

# 2. Objectives

The main objectives of Nova 26 are:

- To help students organize their daily study schedule.
- To provide a digital platform for creating and managing notes.
- To maintain test records and monitor academic performance.
- To improve student productivity and time management.
- To provide future AI-based learning assistance.

---

# 3. Scope of the Project

## 3.1 Current Scope (Version 1)

The first version of Nova 26 will include:

- User registration and login.
- Student dashboard.
- Schedule management.
- Notes management.
- Test record management.
- Calculator.
- User profile.

---

## 3.2 Future Scope

Future versions may include:

- AI study assistant.
- Doubt solving system.
- PDF summarization.
- Voice assistant.
- OCR-based handwritten note scanning.
- Smart study recommendations.
- Cloud synchronization.

# 4. Functional Requirements

Functional requirements describe what the system should do.

---

## 4.1 User Management

The system should allow users to:

- Create a new account.
- Login using valid credentials.
- Logout from the application.
- Manage personal profile information.

---

## 4.2 Student Dashboard

The dashboard should provide:

- Welcome message for the user.
- Quick access to important features.
- Today's schedule overview.
- Recent notes.
- Latest test performance summary.
- Task status.

---

## 4.3 Schedule Management

The system should allow students to:

- Add daily study schedules.
- Edit existing schedules.
- Delete schedules.
- View upcoming activities.
- Organize tasks according to time and priority.

---

## 4.4 Notes Management

The system should allow students to:

- Create notes.
- Edit notes.
- Delete notes.
- Store notes according to subjects.
- Search saved notes.

---

## 4.5 Test Record Management

The system should allow students to:

- Add test information.
- Store subject-wise marks.
- View previous test records.
- Monitor academic improvement.

---

## 4.6 Calculator

The application should provide:

- Basic mathematical calculations.
- Quick access calculator tool for students.

---

## 4.7 AI Assistant (Future Feature)

The AI assistant should provide:

- Question solving support.
- Concept explanations.
- Study recommendations.
- Personalized learning assistance.

---

# 5. Non-Functional Requirements

Non-functional requirements describe system quality.

---

## 5.1 Performance

- The application should load quickly.
- User actions should receive fast responses.
- Database operations should be optimized.

---

## 5.2 Security

- User data should be protected.
- Passwords should be stored securely.
- Unauthorized access should be prevented.

---

## 5.3 Usability

- The interface should be simple and student-friendly.
- Navigation should be easy.
- The application should support mobile screens.

---

## 5.4 Reliability

- Data should be stored safely.
- The system should handle errors properly.
- Regular backups should be possible.

---

## 5.5 Scalability

The application should support:

- More users.
- Additional features.
- Future AI integration.

---

# 6. Technology Requirements

## 6.1 Frontend Technologies

The frontend of Nova 26 will use:

- HTML5 for creating the structure of web pages.
- CSS3 for designing the user interface.
- JavaScript for interactive features and client-side functionality.

The interface will be designed using a mobile-first approach to provide a better experience on smartphones.

---

## 6.2 Backend Technologies

The backend will use:

- Python programming language.
- Flask framework for creating backend services and APIs.

The backend will handle:

- User authentication.
- Data processing.
- Communication between frontend and database.

---

## 6.3 Database Technology

The application will use:

- MySQL database.

MySQL will store:

- User information.
- Notes.
- Schedules.
- Test records.
- Tasks.
- Application settings.

---

# 7. System Architecture

Nova 26 will follow a three-layer architecture:

## 7.1 Presentation Layer

Responsible for:

- User interface.
- Screens.
- User interaction.

Technologies:

- HTML
- CSS
- JavaScript

---

## 7.2 Application Layer

Responsible for:

- Business logic.
- Data processing.
- API communication.

Technology:

- Python Flask

---

## 7.3 Data Layer

Responsible for:

- Storing and retrieving information.

Technology:

- MySQL Database

---

# 8. Database Requirements

The main database tables will include:

## 8.1 Users Table

Stores user account information.

Fields:

- User ID
- Name
- Email
- Password
- Created Date

---

## 8.2 Notes Table

Stores student notes.

Fields:

- Note ID
- User ID
- Subject
- Title
- Content
- Created Date

---

## 8.3 Schedule Table

Stores student schedules.

Fields:

- Schedule ID
- User ID
- Task Name
- Date
- Time
- Priority

---

## 8.4 Tests Table

Stores test performance records.

Fields:

- Test ID
- User ID
- Subject
- Test Name
- Marks
- Date

---

# 9. Development Plan

The development of Nova 26 will follow these stages:

1. UI/UX Design
2. Frontend Development
3. Backend Development
4. Database Integration
5. Feature Implementation
6. Testing
7. Deployment
8. Future AI Integration

---