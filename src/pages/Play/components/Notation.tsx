// Using an interface
interface NotationProps {
    pgn: string;
}


function Notation(props: NotationProps) {
    const pgn = props.pgn;
    return (
        <div>
            <p>Pgn: {pgn}</p>
        </div>
    )
}

export default Notation;