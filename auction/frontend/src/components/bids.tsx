import Table from 'react-bootstrap/Table';

export interface BidInterface {
    author: string,
    amount: number,
    timestamp: number
}

export default function Bids({bids}: {bids: Array<BidInterface>}) {
    if (!bids) {
        return;
    }

    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Author</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                {
                    bids.sort((a, b) => b.amount - a.amount).map((bid: BidInterface) => {
                        return (
                            <tr key={bid.timestamp}>
                                <td>{new Date(bid.timestamp*1000).toLocaleString()}</td>
                                <td>{bid.author}</td>
                                <td>{bid.amount}</td>
                            </tr>
                        )
                    })
                }
            </tbody>
        </Table>
    );
}