export const theme = {
    colors: {
        // Main content area
        background: '#fafafa',
        text: '#1a1a1a',

        // Sidebar
        sidebarBackground: '#1f2937',
        sidebarText: 'white',

        // Links
        link: '#007bff',

        // Cards
        cardBackground: '#ffffff',
        cardText: '#1a1a1a',

        // Buttons
        primary: 'grey',
        primaryText: '#ffffff',
        secondary: 'grey',
        secondaryText: '#ffffff',
        danger: '#991b1b',
        dangerText: '#ffffff',
        buttonHoverBorder: '#ffffff',

        // Form elements
        border: '#d1d5db',
        borderFocus: '#2563eb',
        placeholder: '#9ca3af',
    },
    // Common card/panel styling
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: 300,
        boxSizing: 'border-box',
    } as const,
    // Common card header styling
    cardHeader: {
        margin: '0 0 12px 0',
        fontSize: '1rem',
        color: '#1a1a1a',
    } as const,
};
