export interface Ticket {
    body: string;
    name: string;
    category: "other" | "general" | "billing" | "bug" | "account" | "feature_request";
    email: string;
    subject: string;
}