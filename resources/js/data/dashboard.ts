export interface DashboardData {
    academicYear: string;
    metrics: { cgpa: number; semester: string; credits: number; totalCredits: number; attendance: number };
    courses: { name: string; code: string; instructor: string; credits: number; progress: number; grade?: string; status: string; color: string; monogram: string }[];
    events: { title: string; description: string; month: string; day: string; href: string }[];
    news: { title: string; description: string; body: string };
    schedule: { id: string; dayOffset: number; time: string; duration: string; title: string; room: string; color: string }[];
}
export const demoDashboard: DashboardData = {
    academicYear: '2026–27', metrics: { cgpa: 3.82, semester: '4th', credits: 72, totalCredits: 120, attendance: 94 },
    courses: [
        { name: 'Software Architecture', code: 'CS 301', instructor: 'Alex Rivera', credits: 3, progress: 72, status: 'current', color: 'bg-indigo-50 text-indigo-600', monogram: 'SA' },
        { name: 'Database Systems', code: 'CS 242', instructor: 'Morgan Lee', credits: 3, progress: 58, status: 'current', color: 'bg-orange-50 text-orange-600', monogram: 'DB' },
        { name: 'Human–Computer Interaction', code: 'CS 315', instructor: 'Jamie Cruz', credits: 3, progress: 86, status: 'current', color: 'bg-violet-50 text-violet-600', monogram: 'HC' },
        { name: 'Foundations of Computing', code: 'CS 101', instructor: 'Taylor Reyes', credits: 3, progress: 100, grade: 'A', status: 'completed', color: 'bg-emerald-50 text-emerald-600', monogram: 'FC' },
    ],
    events: [{ title: 'Design systems workshop', description: 'Learning commons · 2:00 PM', month: 'NOV', day: '04', href: '/portal/exams' }, { title: 'Course registration opens', description: 'Plan ahead for next semester', month: 'NOV', day: '12', href: '/portal/registration' }],
    news: { title: 'A new space to learn together', description: 'Discover what’s new at the learning commons.', body: 'The learning commons brings study spaces and shared resources together. Explore the library to find a little inspiration for your next project.' },
    schedule: [{ id: '1', dayOffset: 0, time: '09:00 AM', duration: '09:00 – 10:30 AM', title: 'Software Architecture', room: 'Room 302 · Main building', color: 'indigo' }, { id: '2', dayOffset: 0, time: '11:00 AM', duration: '11:00 AM – 12:30 PM', title: 'Database Systems', room: 'Lab 204 · Technology center', color: 'orange' }, { id: '3', dayOffset: 0, time: '02:00 PM', duration: '02:00 – 03:30 PM', title: 'Human–Computer Interaction', room: 'Room 106 · Design building', color: 'violet' }, { id: '4', dayOffset: 1, time: '10:00 AM', duration: '10:00 – 11:30 AM', title: 'Database Systems', room: 'Lab 204 · Technology center', color: 'orange' }],
};
