# 🗺️ scleorg Product Roadmap

## Current Status (v0.1.0 MVP)

### ✅ Completed Features

#### Core Platform
- [x] Authentication (Clerk v5)
- [x] Database (PostgreSQL + Prisma, 9 tables)
- [x] Monorepo architecture (Turborepo)
- [x] Next.js 14 App Router

#### Data Management
- [x] Manual employee data entry
- [x] Create/Read/Update/Delete datasets
- [x] Create/Read/Update/Delete employees
- [x] Inline employee editing
- [x] Employee deletion with confirmation
- [x] Hire date tracking

#### Calculations & Metrics (15+ metrics)
- [x] Cost metrics (Total Cost, FTE, Cost per FTE)
- [x] Structure metrics (R&D:GTM, Manager:IC, Span of Control)
- [x] Productivity metrics (Revenue per FTE)
- [x] Tenure metrics (Avg tenure, distribution, retention risk)
- [x] Department breakdown
- [x] Outlier detection (z-score analysis)

#### Visualizations
- [x] Department cost bar chart
- [x] FTE distribution chart
- [x] Department pie chart
- [x] Employee count vs cost comparison
- [x] Tenure distribution chart
- [x] Tenure by department chart

#### Analytics & Insights
- [x] Industry benchmark comparisons (OpenView, SaaS Capital)
- [x] Benchmark status indicators (Above/Within/Below)
- [x] AI-powered insights (10+ insight types)
- [x] Compensation outlier detection
- [x] Retention risk analysis
- [x] Real-time metric updates

---

## 📋 Backlog & Prioritization

### Priority 1: Enhanced Employee Management 🔥

#### Employee Detail Modal
> **Requested by user**: "those should be also editable maybe in a detail modal per employee?"

**Why**: Better UX for viewing/editing employee details with more space

**Features**:
- [ ] Full-screen or large modal for employee details
- [ ] Comprehensive employee profile view
  - [ ] Personal info (name, email, department, role, level)
  - [ ] Compensation details (base, bonus, equity breakdown)
  - [ ] Tenure info (hire date, tenure duration, milestones)
  - [ ] Employment details (type, FTE factor, location)
  - [ ] Manager relationship
  - [ ] Cost center
- [ ] Tabbed interface for organization
  - [ ] Overview tab
  - [ ] Compensation history tab (future)
  - [ ] Performance notes tab (future)
  - [ ] Documents tab (future)
- [ ] Edit mode toggle
- [ ] Save/Cancel actions
- [ ] Delete employee option
- [ ] Quick navigation (prev/next employee)

**Implementation**:
- Component: `EmployeeDetailModal.tsx`
- Opens from employee row click or "View Details" button
- Uses React state for modal management
- Fetches full employee data
- Updates via existing PATCH API

**Estimated**: 1-2 days

---

#### Enhanced Employee Table
- [ ] Click row to open detail modal
- [ ] Sortable columns (name, department, compensation, tenure)
- [ ] Filterable by department, level, employment type
- [ ] Search by name or email
- [ ] Bulk selection
- [ ] Export selected to CSV
- [ ] Column visibility toggle

**Estimated**: 2-3 days

---

#### Compensation History Tracking
- [ ] Track compensation changes over time
- [ ] Record effective dates for each change
- [ ] Calculate % increases/decreases
- [ ] Show compensation timeline in modal
- [ ] Analyze compensation trends
- [ ] Identify overdue raises
- [ ] Export compensation history

**Estimated**: 3-4 days

---

### Priority 2: File Upload & Import 📤

**Why**: Faster onboarding, bulk data entry

**Features**:
- [ ] Excel (.xlsx, .xls) upload
- [ ] CSV upload
- [ ] Column mapping UI
- [ ] Data validation & preview
- [ ] Error handling & reporting
- [ ] Partial import on errors
- [ ] Template download
- [ ] Import history

**Implementation**:
- Use `xlsx` library for parsing
- Multi-step wizard UI
- Background processing for large files
- Progress indicators

**Estimated**: 1 week

---

### Priority 3: Scenario Modeling 🎯

**Why**: What-if analysis, strategic planning

**Features**:
- [ ] Create scenarios (Hiring Freeze, Cost Reduction, Growth)
- [ ] Define scenario parameters
  - [ ] Headcount changes
  - [ ] Compensation adjustments
  - [ ] Department shifts
- [ ] Compare scenarios side-by-side
- [ ] Save scenarios for later review
- [ ] Scenario naming & descriptions
- [ ] Undo/redo scenario changes
- [ ] Export scenario analysis

**Calculations Needed**:
- Already implemented in `packages/calculations/src/scenarios/transform.ts`
- Need UI layer

**Estimated**: 1 week

---

### Priority 4: Advanced Visualizations 📊

#### Historical Trends
- [ ] Track metrics over time (QoQ, YoY)
- [ ] Trend line charts
- [ ] Comparison views (Q3 vs Q4)
- [ ] Metric history storage
- [ ] Snapshot functionality

#### Additional Charts
- [ ] Org chart visualization
- [ ] Compensation distribution histogram
- [ ] Tenure heatmap by department
- [ ] Cost trend over time
- [ ] Headcount growth projections

**Estimated**: 1 week

---

### Priority 5: Export & Reporting 📄

**Features**:
- [ ] PDF export (executive summary)
- [ ] Excel export (full data)
- [ ] Custom report builder
- [ ] Scheduled reports (email delivery)
- [ ] Report templates
- [ ] Branding customization

**Implementation**:
- Use `jsPDF` for PDF generation
- Use `xlsx` for Excel export
- Email via SendGrid/Resend

**Estimated**: 1 week

---

### Priority 6: Collaboration Features 👥

**Features**:
- [ ] Team workspaces
- [ ] Share datasets with team members
- [ ] Role-based permissions (View/Edit/Admin)
- [ ] Commenting on metrics
- [ ] Activity feed
- [ ] @mentions
- [ ] Notification system

**Implementation**:
- Update Prisma schema (add workspace, permissions tables)
- Implement invitation system
- Add real-time updates (Pusher/Socket.io)

**Estimated**: 2 weeks

---

### Priority 7: Custom Benchmarks 📈

**Features**:
- [ ] Create custom benchmark sets
- [ ] Import benchmark data
- [ ] Define benchmark sources
- [ ] Compare to custom benchmarks
- [ ] Benchmark versioning
- [ ] Benchmark sharing

**Estimated**: 1 week

---

### Priority 8: API & Integrations 🔌

**Features**:
- [ ] Public REST API
- [ ] API key management
- [ ] Webhook support
- [ ] HRIS integrations
  - [ ] BambooHR
  - [ ] Workday
  - [ ] Gusto
  - [ ] Rippling
- [ ] Slack notifications
- [ ] Google Sheets sync

**Estimated**: 2-3 weeks

---

### Priority 9: Advanced Analytics 🧠

#### Predictive Analytics
- [ ] Attrition prediction (ML model)
- [ ] Optimal hiring timing
- [ ] Compensation recommendation engine
- [ ] Department rebalancing suggestions

#### Deeper Insights
- [ ] Skills gap analysis
- [ ] Diversity & inclusion metrics
- [ ] Performance correlation analysis
- [ ] ROI calculations per employee

**Estimated**: 3-4 weeks

---

### Priority 10: Enterprise Features 🏢

**Features**:
- [ ] SSO (SAML, OIDC)
- [ ] Advanced security
  - [ ] Audit logs
  - [ ] IP whitelisting
  - [ ] Session management
- [ ] Multi-region support
- [ ] Custom integrations
- [ ] Dedicated support
- [ ] SLA guarantees
- [ ] Custom contracts

**Estimated**: 4-6 weeks

---

## 🎨 UI/UX Improvements

### Short-term
- [ ] Employee detail modal (Priority 1)
- [ ] Dark mode toggle
- [ ] Responsive mobile design improvements
- [ ] Loading skeletons
- [ ] Toast notifications (replace alerts)
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements (ARIA labels)

### Medium-term
- [ ] Onboarding tour
- [ ] Interactive tutorials
- [ ] Help center integration
- [ ] Customizable dashboard widgets
- [ ] Saved views/filters
- [ ] Quick actions menu (⌘K)

**Estimated**: 2-3 weeks total

---

## 📊 Data & Performance

### Optimizations
- [ ] Database query optimization
- [ ] Implement Redis caching
- [ ] Lazy loading for large datasets
- [ ] Virtual scrolling for employee tables
- [ ] Debounced search
- [ ] Memoization for calculations
- [ ] Background job processing

### Data Integrity
- [ ] Soft deletes (archive instead of delete)
- [ ] Version history for employees
- [ ] Rollback functionality
- [ ] Data validation rules
- [ ] Import/export validation

**Estimated**: 2 weeks

---

## 🔐 Security & Compliance

### Security
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] SQL injection prevention (already using Prisma)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Security headers

### Compliance
- [ ] GDPR compliance tools
  - [ ] Data export
  - [ ] Data deletion
  - [ ] Consent management
- [ ] SOC 2 compliance
- [ ] Data encryption at rest
- [ ] Data residency options

**Estimated**: 3-4 weeks

---

## 📱 Platform Extensions

### Mobile App
- [ ] React Native mobile app
- [ ] Offline mode
- [ ] Push notifications
- [ ] Quick insights view
- [ ] Approve/reject actions

**Estimated**: 8-12 weeks

### Desktop App
- [ ] Electron wrapper
- [ ] Native integrations
- [ ] Better performance

**Estimated**: 4-6 weeks

---

## 🧪 Testing & Quality

### Current State
- Basic manual testing
- No automated tests

### Planned
- [ ] Unit tests (Jest)
- [ ] Integration tests (Playwright)
- [ ] E2E tests
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Load tests
- [ ] CI/CD pipeline improvements

**Estimated**: 2-3 weeks

---

## 📈 Growth & Scale

### Metrics to Track
- [ ] User analytics (PostHog/Mixpanel)
- [ ] Feature usage tracking
- [ ] Performance monitoring (Sentry)
- [ ] User feedback collection
- [ ] NPS surveys
- [ ] Funnel analysis

### Infrastructure
- [ ] Auto-scaling
- [ ] Multi-region deployment
- [ ] CDN for assets
- [ ] Database replication
- [ ] Disaster recovery

**Estimated**: Ongoing

---

## 🎯 Success Metrics

### Product Metrics
- Time to first insight: < 60 seconds
- Dataset creation rate
- Employee data entry rate
- Feature adoption rates
- User retention (weekly/monthly)

### Business Metrics
- User acquisition
- Conversion rate (free → paid)
- MRR/ARR growth
- Churn rate
- Customer satisfaction (NPS)

---

## 📅 Suggested Timeline

### Month 1-2 (Immediate)
1. ✅ **Employee detail modal** (Priority 1) - Improves UX significantly
2. ✅ **File upload** (Priority 2) - Major time-saver for users
3. ✅ **Toast notifications** - Better feedback

### Month 3-4 (Near-term)
4. ✅ **Scenario modeling** (Priority 3) - Core value proposition
5. ✅ **Historical trends** (Priority 4) - Time-series analysis
6. ✅ **PDF/Excel export** (Priority 5) - Sharing capabilities

### Month 5-6 (Mid-term)
7. ✅ **Collaboration** (Priority 6) - Team features
8. ✅ **Custom benchmarks** (Priority 7) - Flexibility
9. ✅ **HRIS integrations** (Priority 8) - Automation

### Month 7-12 (Long-term)
10. ✅ **Predictive analytics** (Priority 9) - Advanced features
11. ✅ **Enterprise features** (Priority 10) - Scale up
12. ✅ **Mobile app** - Platform expansion

---

## 💡 User Feedback Integration

### How to Prioritize
1. **User requests** (like employee detail modal)
2. **Time to value** (features that save time)
3. **Revenue impact** (features that drive paid conversions)
4. **Competitive parity** (must-have features)
5. **Technical debt** (infrastructure improvements)

### Feedback Channels
- GitHub Issues
- User interviews
- In-app feedback widget (future)
- Support tickets
- Feature request voting (future)

---

## 🚀 Quick Wins (Can ship in < 1 day)

- [ ] Employee detail modal (basic version)
- [ ] Sort table columns
- [ ] Export to CSV
- [ ] Dark mode
- [ ] Keyboard shortcuts (⌘K)
- [ ] Toast notifications
- [ ] Loading states
- [ ] Empty states improvements
- [ ] Error messages improvements
- [ ] Help tooltips

---

## 🎓 Documentation Needs

- [ ] User guide
- [ ] Admin guide
- [ ] API documentation
- [ ] Integration guides
- [ ] Video tutorials
- [ ] FAQ
- [ ] Changelog
- [ ] Release notes

---

## Current Version
**v0.1.0 MVP** - Manual Entry & Analytics

## Next Version
**v0.2.0** - Enhanced UX & Import
- Employee detail modal
- File upload
- Toast notifications
- Improved table features

## Future Versions
**v0.3.0** - Scenarios & History
**v0.4.0** - Collaboration & Sharing
**v0.5.0** - Integrations & API
**v1.0.0** - Enterprise Ready

---

**Last Updated**: November 2024
**Maintained by**: Development Team
**Next Review**: After employee modal implementation
