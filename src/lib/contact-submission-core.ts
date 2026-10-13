export async function deliverContact(dependencies: { notify: () => Promise<string>; receipt: () => Promise<boolean> }) {
 await dependencies.notify();
 // The request is accepted once Discord acknowledges it, even if email is unavailable.
 let receiptDelivered = false;
 try { receiptDelivered = await dependencies.receipt(); } catch { /* do not invite duplicate submissions */ }
 return { receiptDelivered };
}
