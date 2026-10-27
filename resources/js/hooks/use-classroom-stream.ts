import { useEffect, useState } from 'react';
import { getEcho } from '@/lib/echo';

export function useClassroomStream(classroomId: number) {
    const [hasUpdates, setHasUpdates] = useState(false);
    useEffect(() => {
        const echo = getEcho();
        const channel = `classrooms.${classroomId}`;
        echo?.private(channel).listen('.stream.updated', () => setHasUpdates(true));
        return () => { echo?.leave(channel); };
    }, [classroomId]);
    return { hasUpdates, dismissUpdates: () => setHasUpdates(false) };
}
