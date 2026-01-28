export async function sendNotification(title: string, body: string, silent = false) {
    // Browser Web Notification
    if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
            new Notification(title, { body, silent });
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification(title, { body, silent });
            }
        }
    }
}
