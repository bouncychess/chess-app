export const theme = {
    colors: {
        // Main content area
        background: '#c0c0c0',
        text: '#000000',

        // Sidebar
        sidebarBackground: '#000080',
        sidebarText: '#ffffff',

        // Links
        link: '#0000ff',

        // Cards
        cardBackground: '#c0c0c0',
        cardText: '#000000',

        // Buttons
        primary: '#c0c0c0',
        primaryText: '#000000',
        secondary: '#c0c0c0',
        secondaryText: '#000000',
        danger: '#c0c0c0',
        dangerText: '#000000',
        buttonHoverBorder: '#ffffff',

        // Form elements
        border: '#808080',
        borderFocus: '#000080',
        placeholder: '#808080',

        // Chess board
        squareHighlight: 'rgba(255, 221, 0, 0.8)',
        moveHighlight: 'rgba(255, 221, 0, 0.4)',
    },
    // Common card/panel styling — Win95 raised border effect
    card: {
        backgroundColor: '#c0c0c0',
        borderRadius: 0,
        padding: 16,
        boxShadow: 'inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
        overflow: 'hidden',
    } as const,
    // Common card header styling
    cardHeader: {
        margin: '0 0 12px 0',
        fontSize: '1rem',
        color: '#000000',
    } as const,
};
