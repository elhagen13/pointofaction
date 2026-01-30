import styles from "../globals.module.css"
export default function ComponentPlayground(){
    return(
        <div style={{padding: "5rem"}}>

        <table className={`${styles.table} ${styles.gray}`}>
            <thead>
                <tr>
                    <th>a</th>
                    <th>b</th>
                    <th>c</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>d</td>
                    <td>d</td>
                    <td>d</td>
                </tr>
                <tr>
                    <td>e</td>
                    <td>e</td>
                    <td>e</td>
                </tr>
            </tbody>

        </table>
        </div>
    )
}