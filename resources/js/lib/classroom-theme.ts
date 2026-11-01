// A classroom keeps the same color wherever it appears, regardless of pagination.
const themes = [
    { gradient: 'linear-gradient(130deg, #3449ae 0%, #6a42ae 100%)', accent: '#4b41a8', soft: '#eeebff', decoration: '#c6b7ff' },
] as const;

export function getClassroomTheme(id: number) {
    return themes[((id - 1) % themes.length + themes.length) % themes.length];
}
