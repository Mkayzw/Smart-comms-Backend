const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const createDate = (daysAgo = 0, hour = 9, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
};

async function main() {
  console.info('🧹 Clearing existing data...');
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.schedule.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.course.deleteMany(),
    prisma.venue.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = {
    id: randomUUID(),
    email: 'admin@smartuniversity.edu',
    password: passwordHash,
    firstName: 'Amina',
    lastName: 'Rahman',
    role: 'ADMIN',
    staffId: 'ADM-0001',
    department: 'Administration'
  };

  const lecturers = [
    {
      id: randomUUID(),
      email: 'alice.nguyen@smartuniversity.edu',
      password: passwordHash,
      firstName: 'Alice',
      lastName: 'Nguyen',
      role: 'LECTURER',
      staffId: 'L-1001',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'david.kim@smartuniversity.edu',
      password: passwordHash,
      firstName: 'David',
      lastName: 'Kim',
      role: 'LECTURER',
      staffId: 'L-1002',
      department: 'Electrical Engineering'
    },
    {
      id: randomUUID(),
      email: 'fatima.hassan@smartuniversity.edu',
      password: passwordHash,
      firstName: 'Fatima',
      lastName: 'Hassan',
      role: 'LECTURER',
      staffId: 'L-1003',
      department: 'Business Administration'
    },
    {
      id: randomUUID(),
      email: 'james.osei@smartuniversity.edu',
      password: passwordHash,
      firstName: 'James',
      lastName: 'Osei',
      role: 'LECTURER',
      staffId: 'L-1004',
      department: 'Mathematics'
    },
    {
      id: randomUUID(),
      email: 'laura.park@smartuniversity.edu',
      password: passwordHash,
      firstName: 'Laura',
      lastName: 'Park',
      role: 'LECTURER',
      staffId: 'L-1005',
      department: 'Creative Arts'
    }
  ];

  const students = [
    {
      id: randomUUID(),
      email: 'john.doe@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'STUDENT',
      studentId: 'STU2025001',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'maria.silva@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Maria',
      lastName: 'Silva',
      role: 'STUDENT',
      studentId: 'STU2025002',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'liam.chen@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Liam',
      lastName: 'Chen',
      role: 'STUDENT',
      studentId: 'STU2025003',
      department: 'Electrical Engineering'
    },
    {
      id: randomUUID(),
      email: 'aisha.patel@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Aisha',
      lastName: 'Patel',
      role: 'STUDENT',
      studentId: 'STU2025004',
      department: 'Business Administration'
    },
    {
      id: randomUUID(),
      email: 'javier.ruiz@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Javier',
      lastName: 'Ruiz',
      role: 'STUDENT',
      studentId: 'STU2025005',
      department: 'Business Administration'
    },
    {
      id: randomUUID(),
      email: 'chloe.martin@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Chloe',
      lastName: 'Martin',
      role: 'STUDENT',
      studentId: 'STU2025006',
      department: 'Creative Arts'
    },
    {
      id: randomUUID(),
      email: 'grace.lee@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Grace',
      lastName: 'Lee',
      role: 'STUDENT',
      studentId: 'STU2025007',
      department: 'Mathematics'
    },
    {
      id: randomUUID(),
      email: 'noah.johnson@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Noah',
      lastName: 'Johnson',
      role: 'STUDENT',
      studentId: 'STU2025008',
      department: 'Electrical Engineering'
    },
    {
      id: randomUUID(),
      email: 'emma.brown@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Emma',
      lastName: 'Brown',
      role: 'STUDENT',
      studentId: 'STU2025009',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'samuel.wright@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Samuel',
      lastName: 'Wright',
      role: 'STUDENT',
      studentId: 'STU2025010',
      department: 'Mathematics'
    },
    {
      id: randomUUID(),
      email: 'lucia.rossi@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Lucia',
      lastName: 'Rossi',
      role: 'STUDENT',
      studentId: 'STU2025011',
      department: 'Creative Arts'
    },
    {
      id: randomUUID(),
      email: 'ethan.walker@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Ethan',
      lastName: 'Walker',
      role: 'STUDENT',
      studentId: 'STU2025012',
      department: 'Electrical Engineering'
    },
    {
      id: randomUUID(),
      email: 'priya.sharma@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: 'STUDENT',
      studentId: 'STU2025013',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'kelvin.adeyemi@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Kelvin',
      lastName: 'Adeyemi',
      role: 'STUDENT',
      studentId: 'STU2025014',
      department: 'Mathematics'
    },
    {
      id: randomUUID(),
      email: 'olivia.nguyen@student.smartuniversity.edu',
      password: passwordHash,
      firstName: 'Olivia',
      lastName: 'Nguyen',
      role: 'STUDENT',
      studentId: 'STU2025015',
      department: 'Business Administration'
    }
  ];

  const users = [admin, ...lecturers, ...students];
  await prisma.user.createMany({ data: users, skipDuplicates: true });
  console.info(`✅ Inserted ${users.length} users`);

  const venues = [
    {
      id: randomUUID(),
      name: 'Auditorium A',
      building: 'Main Hall',
      capacity: 500,
      facilities: ['Projector', 'Sound System', 'Stage'],
      status: 'AVAILABLE'
    },
    {
      id: randomUUID(),
      name: 'Lecture Room 201',
      building: 'Science Block',
      capacity: 120,
      facilities: ['Projector', 'Lecture Capture', 'Smart Board'],
      status: 'AVAILABLE'
    },
    {
      id: randomUUID(),
      name: 'Lab 3B',
      building: 'Engineering Block',
      capacity: 40,
      facilities: ['Computers', '3D Printers', 'Robotics Kits'],
      status: 'OCCUPIED'
    },
    {
      id: randomUUID(),
      name: 'Business Hub 12',
      building: 'Business School',
      capacity: 80,
      facilities: ['Collaboration Pods', 'Video Conferencing', 'Interactive Display'],
      status: 'AVAILABLE'
    },
    {
      id: randomUUID(),
      name: 'Library Seminar Room',
      building: 'Central Library',
      capacity: 60,
      facilities: ['Video Conferencing', 'Whiteboards', 'Acoustic Panels'],
      status: 'MAINTENANCE'
    },
    {
      id: randomUUID(),
      name: 'Innovation Lab',
      building: 'Innovation Center',
      capacity: 55,
      facilities: ['IoT Devices', 'VR Kits', 'High-Speed WiFi'],
      status: 'AVAILABLE'
    },
    {
      id: randomUUID(),
      name: 'Mathematics Room 5',
      building: 'Mathematics Block',
      capacity: 70,
      facilities: ['Smart Board', 'Document Camera', 'Lecture Capture'],
      status: 'AVAILABLE'
    },
    {
      id: randomUUID(),
      name: 'Creative Studio',
      building: 'Arts Center',
      capacity: 45,
      facilities: ['Lighting Rig', 'Green Screen', 'Editing Suite'],
      status: 'AVAILABLE'
    }
  ];

  await prisma.venue.createMany({ data: venues, skipDuplicates: true });
  console.info(`✅ Inserted ${venues.length} venues`);

  const courses = [
    {
      id: randomUUID(),
      code: 'CSC101',
      name: 'Introduction to Computer Science',
      description: 'Fundamental programming concepts, algorithms, and computational thinking.',
      department: 'Computer Science',
      credits: 3,
      lecturerId: lecturers[0].id
    },
    {
      id: randomUUID(),
      code: 'CSC205',
      name: 'Data Structures and Algorithms',
      description: 'Analysis and implementation of data structures with algorithmic problem-solving.',
      department: 'Computer Science',
      credits: 4,
      lecturerId: lecturers[0].id
    },
    {
      id: randomUUID(),
      code: 'CSC310',
      name: 'Software Engineering Project',
      description: 'Team-based software development lifecycle with agile methodologies.',
      department: 'Computer Science',
      credits: 5,
      lecturerId: lecturers[0].id
    },
    {
      id: randomUUID(),
      code: 'PHY120',
      name: 'University Physics I',
      description: 'Mechanics, thermodynamics, and waves with laboratory applications.',
      department: 'Electrical Engineering',
      credits: 4,
      lecturerId: lecturers[1].id
    },
    {
      id: randomUUID(),
      code: 'ENG310',
      name: 'Systems Control Engineering',
      description: 'Modeling and control of dynamic systems using modern tools.',
      department: 'Electrical Engineering',
      credits: 4,
      lecturerId: lecturers[1].id
    },
    {
      id: randomUUID(),
      code: 'ENG201',
      name: 'Technical Writing and Communication',
      description: 'Professional communication strategies for engineers and scientists.',
      department: 'Electrical Engineering',
      credits: 3,
      lecturerId: lecturers[1].id
    },
    {
      id: randomUUID(),
      code: 'BUS150',
      name: 'Principles of Management',
      description: 'Introduction to management theories, organizational structures, and leadership.',
      department: 'Business Administration',
      credits: 3,
      lecturerId: lecturers[2].id
    },
    {
      id: randomUUID(),
      code: 'BUS220',
      name: 'Business Analytics Fundamentals',
      description: 'Data analysis techniques for strategic decision-making using modern business tools.',
      department: 'Business Administration',
      credits: 4,
      lecturerId: lecturers[2].id
    },
    {
      id: randomUUID(),
      code: 'MAT110',
      name: 'Calculus I',
      description: 'Limits, derivatives, and integrals with applications for science majors.',
      department: 'Mathematics',
      credits: 4,
      lecturerId: lecturers[3].id
    },
    {
      id: randomUUID(),
      code: 'MAT220',
      name: 'Linear Algebra',
      description: 'Vector spaces, linear transformations, eigenvalues, and eigenvectors.',
      department: 'Mathematics',
      credits: 3,
      lecturerId: lecturers[3].id
    },
    {
      id: randomUUID(),
      code: 'ART105',
      name: 'Digital Media and Design',
      description: 'Principles of digital illustration, animation, and multimedia storytelling.',
      department: 'Creative Arts',
      credits: 3,
      lecturerId: lecturers[4].id
    }
  ];

  await prisma.course.createMany({ data: courses, skipDuplicates: true });
  console.info(`✅ Inserted ${courses.length} courses`);

  const courseByCode = Object.fromEntries(courses.map((course) => [course.code, course]));
  const courseById = Object.fromEntries(courses.map((course) => [course.id, course]));
  const venueByName = Object.fromEntries(venues.map((venue) => [venue.name, venue]));
  const venueById = Object.fromEntries(venues.map((venue) => [venue.id, venue]));

  const announcements = [
    {
      id: randomUUID(),
      title: 'Semester 1 Orientation Schedule Released',
      content: 'Welcome to the new academic year! Orientation kicks off on 12 February with faculty meet-and-greets, campus tours, and support service briefings. Check the portal for the full schedule and venue assignments.',
      authorId: admin.id,
      targetAudience: 'ALL',
      pinned: true,
      createdAt: createDate(18, 9)
    },
    {
      id: randomUUID(),
      title: 'Updated Venue Booking Policy',
      content: 'Facilities has updated the booking policy to support hybrid events. Please submit requests at least five business days in advance and include technical requirements so our team can prepare equipment.',
      authorId: admin.id,
      targetAudience: 'ALL',
      pinned: true,
      createdAt: createDate(16, 11)
    },
    {
      id: randomUUID(),
      title: 'Data Structures Lab Rescheduled',
      content: 'The CSC205 lab session originally planned for Wednesday afternoon will now run on Friday from 09:00 to 11:00 in the Innovation Lab due to maintenance in Lab 3B.',
      authorId: lecturers[0].id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(12, 10)
    },
    {
      id: randomUUID(),
      title: 'Mathematics Tutoring Program Launch',
      content: 'Peer tutoring for Calculus I and Linear Algebra begins next week. Sessions run Monday through Thursday evenings in Mathematics Room 5. Sign up on the student portal to reserve a spot.',
      authorId: lecturers[3].id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(11, 13)
    },
    {
      id: randomUUID(),
      title: 'Business Analytics Workshop Registration',
      content: 'Seats are open for the Business Analytics visualization workshop happening on 20 February. Participants will work through case studies using live dashboards. Register by Friday to secure materials.',
      authorId: lecturers[2].id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(10, 14)
    },
    {
      id: randomUUID(),
      title: 'Creative Studio Equipment Training',
      content: 'New camera rigs and lighting kits are now available in the Creative Studio. Mandatory orientation sessions will be held this weekend for students who wish to reserve the equipment for projects.',
      authorId: lecturers[4].id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(9, 15)
    },
    {
      id: randomUUID(),
      title: 'Engineering Safety Drill Reminder',
      content: 'All engineering students and staff must attend the annual safety drill on Thursday at 15:00 in Auditorium A. Review the evacuation plan posted on the intranet ahead of the session.',
      authorId: lecturers[1].id,
      targetAudience: 'ALL',
      pinned: false,
      createdAt: createDate(8, 10)
    },
    {
      id: randomUUID(),
      title: 'Library Extended Hours for Midterms',
      content: 'The Central Library will remain open until 01:00 from 17 to 28 February to support midterm preparation. Quiet study rooms can be reserved in four-hour blocks through the reservation system.',
      authorId: admin.id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(7, 12)
    },
    {
      id: randomUUID(),
      title: 'Research Grant Application Window',
      content: 'Faculty are invited to submit interdisciplinary grant proposals focused on sustainability initiatives. The submission window closes on 15 March. Guidelines and templates are available on the research portal.',
      authorId: admin.id,
      targetAudience: 'LECTURERS',
      pinned: false,
      createdAt: createDate(6, 10)
    },
    {
      id: randomUUID(),
      title: 'Career Services Internship Fair',
      content: 'Career Services is hosting an internship fair on 25 February with over 60 employers attending. Upload your resume to the career portal by 19 February to be included in recruiter lookbooks.',
      authorId: admin.id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(5, 9)
    },
    {
      id: randomUUID(),
      title: 'Campus Sustainability Challenge',
      content: 'Join the month-long sustainability challenge to reduce campus energy consumption. Track your team progress through the mobile app and attend weekly webinars for tips and leaderboard updates.',
      authorId: admin.id,
      targetAudience: 'ALL',
      pinned: false,
      createdAt: createDate(4, 11)
    },
    {
      id: randomUUID(),
      title: 'Weekend Hackathon Sign-up',
      content: 'The School of Computing is running a smart campus hackathon from 23 to 24 February. Teams of up to five can register, and winning prototypes will be fast-tracked for incubation support.',
      authorId: lecturers[0].id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(3, 14)
    }
  ];

  await prisma.announcement.createMany({ data: announcements, skipDuplicates: true });
  console.info(`✅ Inserted ${announcements.length} announcements`);

  const commentMessages = [
    'Thanks for the update! Will bring my friends along.',
    'Will the session be recorded for those who cannot attend?',
    'Looking forward to participating in this initiative.',
    'Could you share the materials afterward for revision?',
    'Appreciate the reminder, this helps a lot.',
    'Is prior registration required or can we walk in?',
    'Great initiative by the organizing team, thank you!',
    'Can we invite external guests or is it internal only?',
    'Will there be refreshments during the break?',
    'Will online access be available for remote students?',
    'Excited for this event, thanks for organizing!',
    'Is there a dress code we should be aware of?'
  ];

  const comments = Array.from({ length: 24 }, (_, index) => {
    const daysAgo = Math.max(1, 24 - index);
    return {
      id: randomUUID(),
      content: commentMessages[index % commentMessages.length],
      userId: students[index % students.length].id,
      announcementId: announcements[index % announcements.length].id,
      createdAt: createDate(daysAgo, 10 + (index % 4) * 2)
    };
  });

  await prisma.comment.createMany({ data: comments, skipDuplicates: true });
  console.info(`✅ Inserted ${comments.length} comments`);

  const scheduleTemplates = [
    { courseCode: 'CSC101', dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '10:00', venueName: 'Lecture Room 201', semester: '2025 Semester 1' },
    { courseCode: 'CSC101', dayOfWeek: 'THURSDAY', startTime: '13:00', endTime: '15:00', venueName: 'Innovation Lab', semester: '2025 Semester 1' },
    { courseCode: 'CSC205', dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '13:00', venueName: 'Lab 3B', semester: '2025 Semester 1' },
    { courseCode: 'CSC205', dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '11:00', venueName: 'Innovation Lab', semester: '2025 Semester 1' },
    { courseCode: 'CSC310', dayOfWeek: 'WEDNESDAY', startTime: '15:00', endTime: '18:00', venueName: 'Innovation Lab', semester: '2025 Semester 1' },
    { courseCode: 'CSC310', dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '13:00', venueName: 'Innovation Lab', semester: '2025 Semester 1' },
    { courseCode: 'PHY120', dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '11:00', venueName: 'Lab 3B', semester: '2025 Semester 1' },
    { courseCode: 'PHY120', dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '10:00', venueName: 'Lab 3B', semester: '2025 Semester 1' },
    { courseCode: 'ENG310', dayOfWeek: 'THURSDAY', startTime: '15:00', endTime: '17:00', venueName: 'Lab 3B', semester: '2025 Semester 1' },
    { courseCode: 'ENG201', dayOfWeek: 'TUESDAY', startTime: '13:00', endTime: '14:30', venueName: 'Library Seminar Room', semester: '2025 Semester 1' },
    { courseCode: 'BUS150', dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '16:00', venueName: 'Business Hub 12', semester: '2025 Semester 1' },
    { courseCode: 'BUS220', dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '10:00', venueName: 'Business Hub 12', semester: '2025 Semester 1' },
    { courseCode: 'MAT110', dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '12:00', venueName: 'Mathematics Room 5', semester: '2025 Semester 1' },
    { courseCode: 'MAT220', dayOfWeek: 'FRIDAY', startTime: '11:00', endTime: '13:00', venueName: 'Mathematics Room 5', semester: '2025 Semester 1' },
    { courseCode: 'ART105', dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '12:00', venueName: 'Creative Studio', semester: '2025 Semester 1' },
    { courseCode: 'ART105', dayOfWeek: 'WEDNESDAY', startTime: '16:00', endTime: '18:00', venueName: 'Creative Studio', semester: '2025 Semester 1' }
  ];

  const schedules = scheduleTemplates.map((template, index) => {
    const course = courseByCode[template.courseCode];
    const venue = venueByName[template.venueName];
    const daysAgo = Math.max(0, 8 - Math.floor(index / 2));
    return {
      id: randomUUID(),
      courseId: course.id,
      lecturerId: course.lecturerId,
      venueId: venue.id,
      dayOfWeek: template.dayOfWeek,
      startTime: template.startTime,
      endTime: template.endTime,
      semester: template.semester,
      createdAt: createDate(daysAgo, 8 + (index % 5))
    };
  });

  await prisma.schedule.createMany({ data: schedules, skipDuplicates: true });
  console.info(`✅ Inserted ${schedules.length} schedules`);

  const enrollments = [];
  const statusCycle = ['ENROLLED', 'IN_PROGRESS', 'WAITLISTED', 'COMPLETED'];
  students.forEach((student, idx) => {
    const selectedIndexes = [
      idx % courses.length,
      (idx + 2) % courses.length,
      (idx + 4) % courses.length,
      (idx + 6) % courses.length
    ];
    const uniqueIndexes = [...new Set(selectedIndexes)];
    uniqueIndexes.forEach((courseIndex, innerIdx) => {
      const daysAgo = Math.max(0, 12 - idx);
      enrollments.push({
        id: randomUUID(),
        courseId: courses[courseIndex].id,
        studentId: student.id,
        status: statusCycle[(idx + innerIdx) % statusCycle.length],
        createdAt: createDate(daysAgo + innerIdx, 11 + ((courseIndex + innerIdx) % 3) * 2)
      });
    });
  });

  await prisma.enrollment.createMany({ data: enrollments, skipDuplicates: true });
  console.info(`✅ Inserted ${enrollments.length} enrollments`);

  const announcementNotifications = announcements.slice(0, 8).flatMap((announcement, idx) => {
    const baseDaysAgo = Math.max(0, 14 - idx * 2);
    return students
      .filter((_, studentIdx) => (studentIdx + idx) % 2 === 0)
      .map((student, studentIdx) => ({
        id: randomUUID(),
        userId: student.id,
        type: 'ANNOUNCEMENT',
        message: `${announcement.title} — check the portal for details.`,
        link: `/announcements/${announcement.id}`,
        read: (studentIdx + idx) % 3 === 0,
        createdAt: createDate(baseDaysAgo + (studentIdx % 3), 9 + (studentIdx % 5))
      }));
  });

  const scheduleNotifications = schedules.slice(0, 12).flatMap((schedule, idx) => {
    const course = courseById[schedule.courseId];
    const venue = venueById[schedule.venueId];
    const baseDaysAgo = Math.max(0, 6 - idx);
    return students
      .filter((_, studentIdx) => (studentIdx + idx) % 4 === 0)
      .map((student, studentIdx) => ({
        id: randomUUID(),
        userId: student.id,
        type: 'SCHEDULE',
        message: `Reminder: ${course.name} meets ${schedule.dayOfWeek} at ${schedule.startTime} in ${venue.name}.`,
        link: `/schedules/${schedule.id}`,
        read: false,
        createdAt: createDate(baseDaysAgo + (studentIdx % 2), 7 + ((studentIdx + idx) % 4) * 2)
      }));
  });

  const adminNotifications = [
    {
      id: randomUUID(),
      userId: admin.id,
      type: 'SYSTEM',
      message: 'Daily digest generated with upcoming events and pending approvals.',
      link: '/admin/dashboard',
      read: false,
      createdAt: createDate(1, 6)
    },
    {
      id: randomUUID(),
      userId: admin.id,
      type: 'SYSTEM',
      message: '3 venue booking requests require review.',
      link: '/admin/venues',
      read: false,
      createdAt: createDate(2, 8)
    }
  ];

  const notifications = [
    ...announcementNotifications,
    ...scheduleNotifications,
    ...adminNotifications
  ];

  await prisma.notification.createMany({ data: notifications, skipDuplicates: true });
  console.info(`✅ Inserted ${notifications.length} notifications`);

  console.info('🎉 Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('❌ Seeding error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
