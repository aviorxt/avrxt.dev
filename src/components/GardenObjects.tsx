/** Lightweight CSS objects with physical materials, rather than pictogram icons. */
export function WorkshopObject() {
    return <div className="garden-card-art desk-workshop" aria-hidden="true"><div className="desk-console"><div className="desk-console-bar"><i/><i/><i/><span>workbench / 01</span></div><div className="desk-console-screen"><span><b>→</b> resolve avrxt.dev</span><span className="desk-console-result">A record found</span><span><b>✓</b> ready when you are<span className="desk-caret">_</span></span></div><div className="desk-console-base"><i/><span>AVRXT / UTILITIES</span><i/></div></div></div>;
}
export function RecordObject() {
    return <div className="garden-card-art desk-music" aria-hidden="true"><div className="desk-sleeve"><span>MUZIX</span><span>THE LISTENING JOURNAL<br/>AVRXT / SIDE A</span></div><div className="desk-vinyl"><div className="desk-vinyl-label"><span>avrxt</span><small>ON REPEAT</small><i/></div></div></div>;
}
export function NotebookObject() {
    return <div className="garden-card-art desk-notes" aria-hidden="true"><div className="desk-notebook"><div className="desk-notebook-cover"><span>FIELD<br/><em>notes.</em></span><i/><small>OBSERVATIONS &<br/>SMALL DISCOVERIES</small><b>AVRXT / VOL. 01</b></div><div className="desk-bookmark"/></div></div>;
}
