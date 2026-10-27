export interface Person { id: number; name: string }
export interface Classroom {
    id: number;
    name: string;
    section: string | null;
    teacher: Person;
    students_count: number;
    invite_code: string | null;
}
export interface StreamItem {
    id: number;
    title: string;
    instructions: string | null;
    points: number;
    due_at: string | null;
    created_at: string;
    author: Person;
}
export interface CursorPage<T> {
    data: T[];
    next_page_url: string | null;
    prev_page_url: string | null;
}
