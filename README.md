# 🚒 Salama Maintenance Scheduler

**A comprehensive fire safety maintenance management system for Saudi Arabia**

[![Deployment Status](https://img.shields.io/badge/Deployment-Ready-brightgreen?style=for-the-badge)](https://github.com/hmztgr/salama-maintenance-system)
[![Version](https://img.shields.io/badge/Version-59-blue?style=for-the-badge)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

## 🎯 Project Status

**✅ PRODUCTION READY - ALL DEPLOYMENT ISSUES RESOLVED**

- **Core Features**: 95% Complete
- **Phase 2 Features**: 100% Implemented  
- **TypeScript Compilation**: ✅ All 14 errors resolved
- **Netlify Deployment**: ✅ Ready for production
- **Testing Status**: All critical functionality verified

## 🚀 Recent Major Updates (v59+)

### ✅ Complete Firebase Storage & File Upload System (NEW)
**Full file upload functionality with Firebase Storage integration**:

- **Firebase Storage Integration**: Complete file upload system with progress tracking
- **CORS Configuration**: Proper CORS rules applied to Firebase Storage bucket
- **Security Rules**: Comprehensive Firebase Storage security rules for authenticated users
- **File Validation**: File type, size, and count validation with Arabic error messages
- **Multiple File Support**: Support for uploading multiple files simultaneously
- **Searchable Dropdowns**: Enhanced dropdown components with real-time search functionality

### ✅ Complete Contract System Restructure
**Major architectural enhancement with full backward compatibility**:

- **Service Batches**: Contracts now support multiple service batches per branch groups
- **Flexible Architecture**: Different services can be assigned to different branch clusters
- **Enhanced Planning**: Visit scheduling now works with granular service batch assignments
- **Backward Compatibility**: All existing forms and data continue to work seamlessly
- **Import/Export**: CSV import system upgraded to support new structure

### ✅ Complete TypeScript Compilation Resolution
All TypeScript compilation errors that were blocking Netlify deployment have been systematically resolved:

- **System Fixes**: Import/export validation, Firebase hooks, branch configuration
- **Async/Await Fixes**: 6 components updated with proper Promise handling
- **Type Safety**: 3 attachment-related type conversions fixed
- **Interface Fixes**: Missing properties added to TypeScript interfaces

## 📋 Core Features

### 🔐 Authentication & User Management
- Role-based access control (Admin, Supervisor, Viewer)
- Quick login system for testing and demonstration
- Comprehensive permission checking

### 🏢 Customer Management
- Complete company, branch, and contract management with **new service batch architecture**
- **Flexible Contract System**: Service batches allow different services for different branch groups
- Arabic-first UI with full RTL support
- Saudi cities validation and fuzzy matching
- Excel/CSV import/export with enhanced validation and automatic structure conversion

### 📅 Visit Planning & Scheduling
- Annual planning with automated scheduling
- Emergency visit management
- Visit completion forms with file attachments
- Real-time status tracking

### 📊 Reporting & Analytics
- Comprehensive visit completion reports
- Company service history tracking
- Team performance analytics
- Advanced filtering and CSV export

## 🏗️ Contract System Architecture

### 📋 New Service Batch Structure
```typescript
Contract {
  companyId: string;
  contractStartDate: string;
  contractEndDate: string;
  serviceBatches: ServiceBatch[];
}

ServiceBatch {
  batchId: string;
  branchIds: string[];  // Branches included in this service batch
  services: {
    fireExtinguisherMaintenance: boolean;
    alarmSystemMaintenance: boolean;
    fireSuppressionMaintenance: boolean;
    gasFireSuppression: boolean;
    foamFireSuppression: boolean;
  };
  regularVisitsPerYear: number;
  emergencyVisitsPerYear: number;
  notes: string;
}
```

### 🔄 Backward Compatibility
- **Old Forms**: Automatically convert single service selections to service batches
- **CSV Import**: Converts old format (individual flags) to new structure seamlessly  
- **Data Display**: Aggregates services from all batches for unified view
- **Visit Planning**: Works with service batches to schedule appropriate visits

## 🛠 Technology Stack

- **Frontend**: Next.js 15.3.2 with TypeScript
- **Styling**: Tailwind CSS with custom Arabic-first components
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: React Context with custom hooks
- **Email Service**: EmailJS for invitation system
- **Deployment**: Netlify (production-ready)

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 18+ 
npm or bun package manager
```

### Installation
```bash
# Clone the repository
git clone https://github.com/hmztgr/salama-maintenance-system.git

# Navigate to project directory
cd salama-maintenance-system/salama-maintenance-system-main

# Install dependencies
bun install
# or
npm install

# Start development server
bun dev
# or  
npm run dev
```

### Environment Setup
Create a `.env.local` file with your Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_USE_FIREBASE=true
```

## 📈 Deployment

### Netlify Deployment
✅ **Ready for production deployment on Netlify**

1. Connect your GitHub repository to Netlify
2. Set build command: `bun run build`
3. Set publish directory: `out`
4. Add environment variables from `.env.local`
5. Deploy!

### Build Commands
```bash
# Development
bun dev

# Production build
bun run build

# Start production server
bun start
```

## 📝 Documentation

- [CHANGELOG.md](./CHANGELOG.md) - Complete change history
- [Project Documents](./.same/project%20documents/) - Comprehensive documentation
- [Progress Report](./.same/project%20documents/progress-report.md) - Current status

## 🤝 Contributing

This is a production project for fire safety maintenance management in Saudi Arabia. For feature requests or bug reports, please contact the development team.

## 📄 License

Copyright (c) 2025 - Salama Maintenance Scheduler Project

---

**🔥 Built for Saudi Arabia's fire safety maintenance industry**
