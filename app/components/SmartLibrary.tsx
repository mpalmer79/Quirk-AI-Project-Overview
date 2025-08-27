import { getSmartResponses } from "@/app/lib/responses";
const items = getSmartResponses(); // [{id,title,email,sms,category}...]

// Render cards with Copy buttons; filter by category
