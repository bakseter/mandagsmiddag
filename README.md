# mandagsmiddag

Dinner on a monday.

## How to run:

### Entire build

(Requires flox to run, otherwise download Docker and bun separately)

1. `flox activate`
2. `colima start`
3. `docker compose up --build`

### Only dev build frontend

1. `cd frontend`
2. `npm run dev`

## User Stories - Monday Dinner Club Application

### 1. Register a Dinner

**As a** dinner host  
**I want to** create a dinner by specifying the date, time, and invited participants  
**So that** I can organize dinner club gatherings and track attendance

**Acceptance Criteria:**

- Host can select any future or past date
- Host can add multiple participants from the user list
- System confirms successful dinner registration
- Dinner appears in host's "My Hosted Dinners" list

---

### 2. Rate Dinner and Film

**As a** dinner guest  
**I want to** provide ratings for both the dinner experience and the film watched in a single submission  
**So that** I can give a rating for the final score at the end of the year

**Acceptance Criteria:**

- Guest can only rate dinners they attended
- Rating interface includes both dinner score and film score fields
- Ratings are submitted together as one action
- Guest cannot edit ratings after submission (or specify edit rules)

---

### 3. View Hosting Schedule

**As a** monday dinner member  
**I want to** see who is scheduled to host the next dinner  
**So that** everyone knows whose turn it is and can plan accordingly

**Acceptance Criteria:**

- System displays the next scheduled host clearly
- Display shows hosting rotation order
- All members can view this information
- System updates automatically after each dinner

---

### 4. View User Scores (Admin)

**As an** administrator  
**I want to** view scoring data for all users in the dinner club  
**So that** I can monitor participation, performance, and resolve disputes

**Acceptance Criteria:**

- Admin can see comprehensive scores for each user
- View includes positive scores, minus points, and total score
- Admin can filter/sort users by different score metrics
- Score history is viewable with timestamps

---

### 5. Assign Penalty Points (Admin)

**As an** administrator  
**I want to** assign minus points to users with an explanation  
**So that** I can enforce dinner club rules and manage accountability

**Acceptance Criteria:**

- Admin must provide a reason when assigning minus points
- System records who assigned the points and when
- User is notified when minus points are assigned (?)
- Minus points are reflected in user's total score

---

### 6. View My Penalty Points

**As a** dinner club member  
**I want to** see all minus points assigned to my account with explanations  
**So that** I understand any penalties and can contest if necessary

**Acceptance Criteria:**

- User sees a complete list of minus points received
- Each entry shows: point value, reason, date, and who assigned it
- Total minus points are clearly displayed
- User can see how minus points affect their overall score

---

### 7. View My Attendance History

**As a** dinner club member  
**I want to** see a history of all dinners I've attended as a guest  
**So that** I can track my participation and review past events

**Acceptance Criteria:**

- List shows all dinners attended with dates
- Each entry displays: host name, date, ratings given (if any)
- List is sortable by date
- Shows total number of dinners attended

---

### 8. View My Hosted Dinners

**As a** dinner club member  
**I want to** see a history of all dinners I have hosted  
**So that** I can review my hosting record

**Acceptance Criteria:**

- List shows all dinners hosted with dates
- Each entry displays: participants, food eaten
- List is sortable by date

---
