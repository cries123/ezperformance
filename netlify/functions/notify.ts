import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { name, phone, vehicle, service, priceLabel } = JSON.parse(event.body || "{}");
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!discordUrl) {
      console.warn("DISCORD_WEBHOOK_URL not found in Netlify environment variables.");
      return {
        statusCode: 200,
        body: JSON.stringify({ success: false, message: "Webhook URL not configured on Netlify" }),
      };
    }

    const response = await fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: "🏎️ **NEW BOOKING REQUEST** @everyone",
        embeds: [{
          title: "Project Engagement Logged",
          color: 3447003,
          fields: [
            { name: "Customer", value: name || "N/A", inline: true },
            { name: "Phone", value: phone || "N/A", inline: true },
            { name: "Vehicle", value: vehicle || "N/A" },
            { name: "Service", value: service || "N/A" },
            { name: "Estimated Total", value: priceLabel || "Custom Quote" }
          ],
          footer: { text: "Precision Mechanical Engine • Booking Terminal v2" },
          timestamp: new Date().toISOString()
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Notification sent successfully" }),
    };
  } catch (error: any) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
