import { useState, useEffect, useRef, useCallback } from 'react';

const ads = [
    {
        title: 'CONGRATULATIONS!!!',
        body: 'You are the 1,000,000th visitor! Click here to claim your FREE chess set!',
        button: 'CLAIM NOW!!!',
        installing: 'Installing FreeChessSet.exe...',
    },
    {
        title: 'WARNING: Chess Detected',
        body: 'Your chess skills are DANGEROUSLY low. Download ChessMaster Pro to fix this issue.',
        button: 'Download Now',
        installing: 'Installing ChessMasterPro.exe...',
    },
    {
        title: 'Hot Singles In Your Area',
        body: 'Local chess players want to play YOU! 1v1 blitz matches available now.',
        button: 'Meet Them',
        installing: 'Installing ChessDate.exe...',
    },
    {
        title: 'FREE Memory Upgrade',
        body: 'Your PC only has 4MB of RAM. Upgrade to 8MB to improve your chess rating!',
        button: 'Upgrade RAM',
        installing: 'Installing MoreRAM.exe...',
    },
    {
        title: 'You Won\'t BELIEVE This',
        body: 'Grandmasters HATE this one weird trick. En passant discovered in 1561!',
        button: 'Learn More',
        installing: 'Installing EnPassant.exe...',
    },
];

function randomAd() {
    return ads[Math.floor(Math.random() * ads.length)];
}

type AdInstance = {
    id: number;
    ad: typeof ads[number];
    top: number;
    left: number;
};

let nextId = 0;

function ProgressBar({ label, onDone }: { label: string; onDone: () => void }) {
    const [progress, setProgress] = useState(0);
    const doneRef = useRef(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + 1 + Math.random() * 3;
                if (next >= 100 && !doneRef.current) {
                    doneRef.current = true;
                    clearInterval(interval);
                    setTimeout(onDone, 500);
                    return 100;
                }
                return Math.min(next, 100);
            });
        }, 120);
        return () => clearInterval(interval);
    }, [onDone]);

    return (
        <div style={{ padding: 12, textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: '#000000', marginBottom: 8 }}>
                {progress < 100 ? label : 'Installation complete!'}
            </div>
            <div style={{
                width: '100%',
                height: 20,
                backgroundColor: '#ffffff',
                boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #dfdfdf',
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#000080',
                    backgroundImage: 'repeating-linear-gradient(90deg, #000080 0px, #000080 10px, #0000a8 10px, #0000a8 12px)',
                    transition: 'width 0.1s linear',
                }} />
            </div>
            <div style={{ fontSize: '11px', color: '#808080', marginTop: 4, textAlign: 'right' }}>
                {Math.round(progress)}%
            </div>
        </div>
    );
}

function SingleAd({ instance, onClose, onInstallDone }: {
    instance: AdInstance;
    onClose: (inst: AdInstance) => void;
    onInstallDone: (inst: AdInstance) => void;
}) {
    const [installing, setInstalling] = useState(false);
    const { ad } = instance;

    return (
        <div style={{
            position: 'fixed',
            top: instance.top,
            left: instance.left,
            width: 300,
            zIndex: 9999,
            backgroundColor: '#c0c0c0',
            boxShadow: 'inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf, 4px 4px 0 rgba(0,0,0,0.3)',
        }}>
            <div style={{
                background: 'linear-gradient(90deg, #000080, #1084d0)',
                color: '#ffffff',
                padding: '2px 4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 700,
            }}>
                <span>{installing ? 'Installing...' : ad.title}</span>
                <button
                    onClick={() => onClose(instance)}
                    style={{
                        background: '#c0c0c0',
                        border: 'none',
                        boxShadow: 'inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff',
                        width: 16,
                        height: 14,
                        fontSize: '10px',
                        lineHeight: '10px',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000',
                        fontWeight: 700,
                        minHeight: 'auto',
                    }}
                >
                    X
                </button>
            </div>
            {installing ? (
                <ProgressBar label={ad.installing} onDone={() => onInstallDone(instance)} />
            ) : (
                <div style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{
                        fontSize: '13px',
                        marginBottom: 12,
                        color: '#000000',
                        lineHeight: 1.4,
                    }}>
                        {ad.body}
                    </div>
                    <button
                        onClick={() => setInstalling(true)}
                        style={{
                            backgroundColor: '#c0c0c0',
                            color: '#000000',
                            border: 'none',
                            boxShadow: 'inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
                            padding: '4px 20px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            minHeight: 23,
                        }}
                    >
                        {ad.button}
                    </button>
                </div>
            )}
        </div>
    );
}

function clampPosition(top: number, left: number) {
    return {
        top: Math.max(10, Math.min(top, window.innerHeight - 200)),
        left: Math.max(10, Math.min(left, window.innerWidth - 320)),
    };
}

export function PopupAd() {
    const [instances, setInstances] = useState<AdInstance[]>([]);

    useEffect(() => {
        const delay = 5000 + Math.random() * 15000;
        const timer = setTimeout(() => {
            const inst: AdInstance = {
                id: nextId++,
                ad: randomAd(),
                top: 50 + Math.random() * (window.innerHeight - 300),
                left: 50 + Math.random() * (window.innerWidth - 350),
            };
            setInstances([inst]);
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = useCallback((inst: AdInstance) => {
        setInstances(prev => {
            const without = prev.filter(i => i.id !== inst.id);
            const offset1 = clampPosition(inst.top - 30, inst.left + 40);
            const offset2 = clampPosition(inst.top + 30, inst.left - 40);
            const spawn1: AdInstance = { id: nextId++, ad: randomAd(), ...offset1 };
            const spawn2: AdInstance = { id: nextId++, ad: randomAd(), ...offset2 };
            return [...without, spawn1, spawn2];
        });
    }, []);

    const handleInstallDone = useCallback((inst: AdInstance) => {
        setInstances(prev => prev.filter(i => i.id !== inst.id));
    }, []);

    return (
        <>
            {instances.map(inst => (
                <SingleAd
                    key={inst.id}
                    instance={inst}
                    onClose={handleClose}
                    onInstallDone={handleInstallDone}
                />
            ))}
        </>
    );
}
