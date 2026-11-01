// A classroom keeps the same color wherever it appears, regardless of pagination.
const themes = [
    { gradient: 'linear-gradient(130deg, #3449ae 0%, #6a42ae 100%)', accent: '#4b41a8', soft: '#eeebff', decoration: '#c6b7ff' },
    { gradient: 'linear-gradient(130deg, #096c72 0%, #08745e 100%)', accent: '#086d67', soft: '#def6ee', decoration: '#8ce1c3' },
    { gradient: 'linear-gradient(130deg, #a84032 0%, #a04c18 100%)', accent: '#a13e2c', soft: '#fff0e5', decoration: '#ffcc9c' },
] as const;

export function getClassroomTheme(id: number) {
    return themes[((id - 1) % themes.length + themes.length) % themes.length];
}
