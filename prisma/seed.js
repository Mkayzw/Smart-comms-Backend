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
    email: 'chikowore.matsvai@uz.ac.zw',
    password: passwordHash,
    firstName: 'Chikowore',
    lastName: 'Matsvai',
    role: 'ADMIN',
    staffId: 'ADM-0001',
    department: 'Administration'
  };

  const lecturers = [
    {
      id: randomUUID(),
      email: 'tendai.mudzengerere@uz.ac.zw',
      password: passwordHash,
      firstName: 'Tendai',
      lastName: 'Mudzengerere',
      role: 'LECTURER',
      staffId: 'L-1001',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'vimbai.gumbo@uz.ac.zw',
      password: passwordHash,
      firstName: 'Vimbai',
      lastName: 'Gumbo',
      role: 'LECTURER',
      staffId: 'L-1002',
      department: 'Electrical Engineering'
    },
    {
      id: randomUUID(),
      email: 'tinashe.mutsvangwa@uz.ac.zw',
      password: passwordHash,
      firstName: 'Tinashe',
      lastName: 'Mutsvangwa',
      role: 'LECTURER',
      staffId: 'L-1003',
      department: 'Business Administration'
    },
    {
      id: randomUUID(),
      email: 'ruvarashe.matsinde@uz.ac.zw',
      password: passwordHash,
      firstName: 'Ruvarashe',
      lastName: 'Matsinde',
      role: 'LECTURER',
      staffId: 'L-1004',
      department: 'Mathematics'
    },
    {
      id: randomUUID(),
      email: 'tatenda.chinamasa@uz.ac.zw',
      password: passwordHash,
      firstName: 'Tatenda',
      lastName: 'Chinamasa',
      role: 'LECTURER',
      staffId: 'L-1005',
      department: 'Creative Arts'
    }
  ];

  const students = [
    {
      id: randomUUID(),
      email: 'R2420129@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Tanyaradzwa',
      lastName: 'Moyo',
      role: 'STUDENT',
      studentId: 'STU2025001',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'R2410456@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Tapiwa',
      lastName: 'Chimurenga',
      role: 'STUDENT',
      studentId: 'STU2025002',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'R2311876@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Chipo',
      lastName: 'Matsvai',
      role: 'STUDENT',
      studentId: 'STU2025003',
      department: 'Electrical Engineering'
    },
    {
      id: randomUUID(),
      email: 'R2322098@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Farai',
      lastName: 'Mutasa',
      role: 'STUDENT',
      studentId: 'STU2025004',
      department: 'Business Administration'
    },
    {
      id: randomUUID(),
      email: 'R2331543@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Kudzai',
      lastName: 'Makoni',
      role: 'STUDENT',
      studentId: 'STU2025005',
      department: 'Business Administration'
    },
    {
      id: randomUUID(),
      email: 'R2423789@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Nyasha',
      lastName: 'Chikowore',
      role: 'STUDENT',
      studentId: 'STU2025006',
      department: 'Creative Arts'
    },
    {
      id: randomUUID(),
      email: 'R2214321@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Tendai',
      lastName: 'Zvobgo',
      role: 'STUDENT',
      studentId: 'STU2025007',
      department: 'Mathematics'
    },
    {
      id: randomUUID(),
      email: 'R2428765@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Rumbidzai',
      lastName: 'Mushonga',
      role: 'STUDENT',
      studentId: 'STU2025008',
      department: 'Electrical Engineering'
    },
    {
      id: randomUUID(),
      email: 'R2339654@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Takudzwa',
      lastName: 'Ngwenya',
      role: 'STUDENT',
      studentId: 'STU2025009',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'R2212345@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Simba',
      lastName: 'Mudzengerere',
      role: 'STUDENT',
      studentId: 'STU2025010',
      department: 'Mathematics'
    },
    {
      id: randomUUID(),
      email: 'R2434567@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Vimbai',
      lastName: 'Gumbo',
      role: 'STUDENT',
      studentId: 'STU2025011',
      department: 'Creative Arts'
    },
    {
      id: randomUUID(),
      email: 'R2328901@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Tinashe',
      lastName: 'Mutsvangwa',
      role: 'STUDENT',
      studentId: 'STU2025012',
      department: 'Electrical Engineering'
    },
    {
      id: randomUUID(),
      email: 'R2445678@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Ruvarashe',
      lastName: 'Matsinde',
      role: 'STUDENT',
      studentId: 'STU2025013',
      department: 'Computer Science'
    },
    {
      id: randomUUID(),
      email: 'R2237890@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Tatenda',
      lastName: 'Chinamasa',
      role: 'STUDENT',
      studentId: 'STU2025014',
      department: 'Mathematics'
    },
    {
      id: randomUUID(),
      email: 'R2341234@students.uz.ac.zw',
      password: passwordHash,
      firstName: 'Natsai',
      lastName: 'Musarurwa',
      role: 'STUDENT',
      studentId: 'STU2025015',
      department: 'Business Administration'
    }
  ];

  const users = [admin, ...lecturers, ...students];
  await prisma.user.createMany({ data: users, skipDuplicates: true });
  console.info(`✅ Inserted ${users.length} users`);

  const venues = [
    // A - C
    { id: randomUUID(), name: 'Agriculture Conference Hall', building: 'Agriculture Block', capacity: 200, facilities: ['Projector', 'Sound System'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Agriculture Seminar Room 1', building: 'Agriculture Block', capacity: 30, facilities: ['Whiteboard', 'Projector'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Beit Hall', building: 'Main Campus', capacity: 500, facilities: ['Projector', 'Sound System', 'Stage'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Biological Science Lab (BSD2)', building: 'Science Block', capacity: 40, facilities: ['Lab Equipment', 'Microscopes'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Business Management Science and Economics Theatre', building: 'Business Block', capacity: 150, facilities: ['Projector', 'Sound System'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'CAPS IT', building: 'IT Block', capacity: 60, facilities: ['Computers', 'Projector'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Commerce Computer Lab', building: 'Commerce Block', capacity: 45, facilities: ['Computers', 'Internet'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Commercial Law Lecture Room F1', building: 'Law Block', capacity: 80, facilities: ['Projector', 'Whiteboard'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Computer Engineering', building: 'Engineering Block', capacity: 50, facilities: ['Computers', 'Specialized Equipment'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Computer Lab Education', building: 'Education Block', capacity: 40, facilities: ['Computers', 'Educational Software'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Computer Lab-Social & Behavioural Sciences', building: 'Social Sciences Block', capacity: 35, facilities: ['Computers', 'SPSS Software'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Computer Science Hardware Lab', building: 'Computer Science Block', capacity: 30, facilities: ['Hardware Equipment', 'Tools'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Confucious Institute', building: 'Language Center', capacity: 100, facilities: ['Projector', 'Audio System'], status: 'AVAILABLE' },
    
    // D - G
    { id: randomUUID(), name: 'Drawing Office', building: 'Engineering Block', capacity: 25, facilities: ['Drawing Tables', 'Storage'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Education Art and Design Studio Building', building: 'Education Block', capacity: 45, facilities: ['Art Supplies', 'Design Tools'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Education Lecture Rooms (3, 4)', building: 'Education Block', capacity: 60, facilities: ['Projector', 'Whiteboard'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Education Rooms (106, 107)', building: 'Education Block', capacity: 40, facilities: ['Projector', 'Whiteboard'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Electrical Engineering Lab', building: 'Engineering Block', capacity: 35, facilities: ['Lab Equipment', 'Circuits'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Electrical Engineering Seminar Room 4', building: 'Engineering Block', capacity: 25, facilities: ['Whiteboard', 'Projector'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Electrical Seminar Room 3', building: 'Engineering Block', capacity: 25, facilities: ['Whiteboard', 'Projector'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Geography Lecture Theatre', building: 'Science Block', capacity: 120, facilities: ['Projector', 'Maps', 'Globes'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Geology (G2)', building: 'Science Block', capacity: 40, facilities: ['Rock Samples', 'Microscopes'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Geomatics Seminar Room (2, 3)', building: 'Science Block', capacity: 30, facilities: ['Surveying Equipment', 'Computers'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Great Hall', building: 'Main Campus', capacity: 1000, facilities: ['Sound System', 'Stage', 'Projector'], status: 'AVAILABLE' },
    
    // H - L
    { id: randomUUID(), name: 'History Seminar Room', building: 'Humanities Block', capacity: 25, facilities: ['Projector', 'Whiteboard'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'HLT 200 and 300', building: 'Humanities Block', capacity: 200, facilities: ['Projector', 'Sound System'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Humanities Lecture Theatre 500 (HLT500)', building: 'Humanities Block', capacity: 500, facilities: ['Projector', 'Sound System'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Ind. and Mech SR (1, 2, 3)', building: 'Engineering Block', capacity: 30, facilities: ['Projector', 'Whiteboard'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Law Lecture Room', building: 'Law Block', capacity: 80, facilities: ['Projector', 'Law Library'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Lecture Theatre 1&2', building: 'Main Campus', capacity: 150, facilities: ['Projector', 'Sound System'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Library Computer Lab', building: 'Library', capacity: 50, facilities: ['Computers', 'Internet', 'Printers'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Llewellin Hall (often listed as LHMEZZ)', building: 'Main Campus', capacity: 300, facilities: ['Projector', 'Sound System'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Llewelyn/Llewellin Lecture Rooms (1, 3, 5, F1, F3, G1, G2)', building: 'Main Campus', capacity: 100, facilities: ['Projector', 'Whiteboard'], status: 'AVAILABLE' },
    
    // M - R
    { id: randomUUID(), name: 'Mathematics Seminar Room 5', building: 'Mathematics Block', capacity: 30, facilities: ['Whiteboard', 'Projector'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Mining Engineering Seminar Room (1, 2)', building: 'Engineering Block', capacity: 25, facilities: ['Projector', 'Mining Equipment'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'MSE Room', building: 'Science Block', capacity: 40, facilities: ['Lab Equipment', 'Microscopes'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'MTR Room', building: 'Science Block', capacity: 30, facilities: ['Lab Equipment'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'New Commerce Building (LG3, LG4)', building: 'Commerce Block', capacity: 120, facilities: ['Projector', 'Computers'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'NLT400 (New Lecture Theatre 400)', building: 'Main Campus', capacity: 400, facilities: ['Projector', 'Sound System'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Old Medical Lecture', building: 'Medical Block', capacity: 150, facilities: ['Projector', 'Medical Models'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Rural & Urban Planning Studio (1, 2)', building: 'Planning Block', capacity: 35, facilities: ['Design Tools', 'Computers'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'RUP Lecture Room 6', building: 'Planning Block', capacity: 40, facilities: ['Projector', 'Whiteboard'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'RUP PA4', building: 'Planning Block', capacity: 25, facilities: ['Computers', 'Planning Software'], status: 'AVAILABLE' },
    
    // S - V
    { id: randomUUID(), name: 'Science Lecture Theatre', building: 'Science Block', capacity: 200, facilities: ['Projector', 'Sound System'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Science Seminar Rooms', building: 'Science Block', capacity: 30, facilities: ['Projector', 'Whiteboard'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Space Science & Applied Physics Dept', building: 'Science Block', capacity: 50, facilities: ['Lab Equipment', 'Computers'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Student Union Building', building: 'Student Center', capacity: 300, facilities: ['Sound System', 'Stage'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Surveying Seminar Room (1, 3)', building: 'Engineering Block', capacity: 25, facilities: ['Surveying Equipment', 'Computers'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Timber Lecture Room', building: 'Agriculture Block', capacity: 40, facilities: ['Timber Samples', 'Projector'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Vet Science', building: 'Veterinary Block', capacity: 60, facilities: ['Lab Equipment', 'Medical Tools'], status: 'AVAILABLE' },
    { id: randomUUID(), name: 'Network Degree Lab', building: 'IT Block', capacity: 45, facilities: ['Computers', 'Network Equipment'], status: 'AVAILABLE' }
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
      content: 'The CSC205 lab session originally planned for Wednesday afternoon will now run on Friday from 09:00 to 11:00 in the Network Degree Lab due to maintenance in the Computer Engineering lab.',
      authorId: lecturers[0].id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(12, 10)
    },
    {
      id: randomUUID(),
      title: 'Mathematics Tutoring Program Launch',
      content: 'Peer tutoring for Calculus I and Linear Algebra begins next week. Sessions run Monday through Thursday evenings in Mathematics Seminar Room 5. Sign up on the student portal to reserve a spot.',
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
      title: 'Education Art and Design Studio Equipment Training',
      content: 'New camera rigs and lighting kits are now available in the Education Art and Design Studio Building. Mandatory orientation sessions will be held this weekend for students who wish to reserve the equipment for projects.',
      authorId: lecturers[4].id,
      targetAudience: 'STUDENTS',
      pinned: false,
      createdAt: createDate(9, 15)
    },
    {
      id: randomUUID(),
      title: 'Engineering Safety Drill Reminder',
      content: 'All engineering students and staff must attend the annual safety drill on Thursday at 15:00 in the Great Hall. Review the evacuation plan posted on the intranet ahead of the session.',
      authorId: lecturers[1].id,
      targetAudience: 'ALL',
      pinned: false,
      createdAt: createDate(8, 10)
    },
    {
      id: randomUUID(),
      title: 'Library Extended Hours for Midterms',
      content: 'The Library Computer Lab will remain open until 01:00 from 17 to 28 February to support midterm preparation. Quiet study rooms can be reserved in four-hour blocks through the reservation system.',
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
    { courseCode: 'CSC101', dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '10:00', venueName: 'Computer Lab Education', semester: '2025 Semester 1' },
    { courseCode: 'CSC101', dayOfWeek: 'THURSDAY', startTime: '13:00', endTime: '15:00', venueName: 'Computer Science Hardware Lab', semester: '2025 Semester 1' },
    { courseCode: 'CSC205', dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '13:00', venueName: 'Computer Engineering', semester: '2025 Semester 1' },
    { courseCode: 'CSC205', dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '11:00', venueName: 'Network Degree Lab', semester: '2025 Semester 1' },
    { courseCode: 'CSC310', dayOfWeek: 'WEDNESDAY', startTime: '15:00', endTime: '18:00', venueName: 'CAPS IT', semester: '2025 Semester 1' },
    { courseCode: 'CSC310', dayOfWeek: 'SATURDAY', startTime: '10:00', endTime: '13:00', venueName: 'CAPS IT', semester: '2025 Semester 1' },
    { courseCode: 'PHY120', dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '11:00', venueName: 'Electrical Engineering Lab', semester: '2025 Semester 1' },
    { courseCode: 'PHY120', dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '10:00', venueName: 'Electrical Engineering Lab', semester: '2025 Semester 1' },
    { courseCode: 'ENG310', dayOfWeek: 'THURSDAY', startTime: '15:00', endTime: '17:00', venueName: 'Electrical Engineering Seminar Room 4', semester: '2025 Semester 1' },
    { courseCode: 'ENG201', dayOfWeek: 'TUESDAY', startTime: '13:00', endTime: '14:30', venueName: 'Library Computer Lab', semester: '2025 Semester 1' },
    { courseCode: 'BUS150', dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '16:00', venueName: 'Business Management Science and Economics Theatre', semester: '2025 Semester 1' },
    { courseCode: 'BUS220', dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '10:00', venueName: 'New Commerce Building (LG3, LG4)', semester: '2025 Semester 1' },
    { courseCode: 'MAT110', dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '12:00', venueName: 'Mathematics Seminar Room 5', semester: '2025 Semester 1' },
    { courseCode: 'MAT220', dayOfWeek: 'FRIDAY', startTime: '11:00', endTime: '13:00', venueName: 'Mathematics Seminar Room 5', semester: '2025 Semester 1' },
    { courseCode: 'ART105', dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '12:00', venueName: 'Education Art and Design Studio Building', semester: '2025 Semester 1' },
    { courseCode: 'ART105', dayOfWeek: 'WEDNESDAY', startTime: '16:00', endTime: '18:00', venueName: 'Education Art and Design Studio Building', semester: '2025 Semester 1' }
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
