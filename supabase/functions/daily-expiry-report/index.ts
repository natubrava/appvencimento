import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const resendApiKey = Deno.env.get("RESEND_API_KEY")
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
            status: 405, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        })
    }

    try {
        if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing environment variables. Make sure RESEND_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data: settingsData, error: settingsError } = await supabase
            .from("settings")
            .select("*")
            .single()

        if (settingsError) throw new Error("Error fetching settings: " + settingsError.message)

        const alertYellowDays = settingsData?.alert_yellow_days || 90
        const alertRedDays = settingsData?.alert_red_days || 60

        const notificationEmail = settingsData?.notification_email || "natubrava@gmail.com"

        const { data: expiryRecords, error: expiryError } = await supabase
            .from("expiry_records")
            .select("*")
            .eq("status", "active")
        
        if (expiryError) throw new Error("Error fetching expiry records: " + expiryError.message)

        if (!expiryRecords || expiryRecords.length === 0) {
            return new Response(JSON.stringify({ message: "No active products." }), { 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            })
        }

        const expiringItems = []

        expiryRecords.forEach(record => {
            const expDate = new Date(record.expiry_date);
            const todayLocal = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            const objDateLocal = new Date(expDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            
            todayLocal.setHours(0, 0, 0, 0);
            objDateLocal.setHours(0, 0, 0, 0);
        
            const diffTime = (objDateLocal.getTime() - todayLocal.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= alertYellowDays) {
                expiringItems.push({...record, days: diffDays, expDateObj: objDateLocal});
            }
        });

        if (expiringItems.length === 0) {
            return new Response(JSON.stringify({ message: "No items expiring soon or expired." }), { 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            })
        }

        // Sort items by expiration date (most overdue first)
        expiringItems.sort((a, b) => a.days - b.days);

        const vencidosCount = expiringItems.filter(i => i.days < 0).length;
        const hojeCount = expiringItems.filter(i => i.days === 0).length;
        const proximosCount = expiringItems.filter(i => i.days > 0).length;

        const reportDateObj = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const reportDateStr = `${String(reportDateObj.getDate()).padStart(2, '0')}/${String(reportDateObj.getMonth() + 1).padStart(2, '0')}/${reportDateObj.getFullYear()}`;

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px 0;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1e8449, #2ecc71); text-align: center; padding: 30px 20px 45px; color: white;">
                        <h2 style="margin: 0; font-size: 24px; font-weight: bold;">🌿 NatuBrava - Alertas de Vencimento</h2>
                        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Resumo do dia ${reportDateStr}</p>
                    </div>

                    <!-- Summary Cards Container -->
                    <div style="display: flex; justify-content: space-between; margin: -25px 20px 20px 20px; gap: 10px;">
                        <!-- Vencidos -->
                        <div style="background: #fff0f0; border-radius: 10px; padding: 15px 10px; flex: 1; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 26px; font-weight: bold; color: #e53935; line-height: 1;">${vencidosCount}</div>
                            <div style="font-size: 13px; color: #9e9e9e; margin-top: 5px;">Vencidos</div>
                        </div>
                        <!-- Vencem Hoje -->
                        <div style="background: #fff0f0; border-radius: 10px; padding: 15px 10px; flex: 1; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 26px; font-weight: bold; color: #e53935; line-height: 1;">${hojeCount}</div>
                            <div style="font-size: 13px; color: #9e9e9e; margin-top: 5px;">Vencem Hoje</div>
                        </div>
                        <!-- Próximos -->
                        <div style="background: #fffdf5; border-radius: 10px; padding: 15px 10px; flex: 1; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 26px; font-weight: bold; color: #fbc02d; line-height: 1;">${proximosCount}</div>
                            <div style="font-size: 13px; color: #9e9e9e; margin-top: 5px;">Próximos</div>
                        </div>
                    </div>

                    <!-- List -->
                    <div style="padding: 0 20px 20px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <th style="text-align: left; padding-bottom: 15px; font-size: 12px; color: #757575; letter-spacing: 0.5px;">PRODUTO</th>
                                    <th style="text-align: right; padding-bottom: 15px; font-size: 12px; color: #757575; letter-spacing: 0.5px;">VALIDADE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${expiringItems.map(item => {
                                    const expDateStr = String(item.expDateObj.getDate()).padStart(2, '0') + '/' + String(item.expDateObj.getMonth() + 1).padStart(2, '0') + '/' + item.expDateObj.getFullYear();
                                    return `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 15px 0; padding-right: 15px;">
                                            <div style="font-weight: bold; font-size: 13px; color: #212121; line-height: 1.4; text-transform: uppercase;">${item.product_name}</div>
                                            <div style="font-size: 12px; color: #9e9e9e; margin-top: 4px;">Lote: ${item.sku || '-'}</div>
                                        </td>
                                        <td style="text-align: right; padding: 15px 0; font-size: 14px; color: #212121; vertical-align: top;">
                                            ${expDateStr}
                                        </td>
                                    </tr>
                                    `
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 30px 20px 10px;">
                    <a href="https://natubrava.github.io/appvencimento/" style="background-color: #5d6d7e; color: white; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; font-size: 15px;">Acessar Sistema</a>
                </div>
            </div>
        `

        const resendReq = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "Controle de Vencimentos <onboarding@resend.dev>",
                to: [notificationEmail],
                subject: `⚠️ Relatório de Vencimentos - ${new Date().toLocaleDateString('pt-BR')}`,
                html: htmlBody
            })
        })

        if (!resendReq.ok) {
            const resendError = await resendReq.json()
            throw new Error("Failed to send email: " + JSON.stringify(resendError))
        }

        return new Response(JSON.stringify({ message: "Daily report email sent successfully!" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        })

    } catch (err) {
        console.error("Function error:", err.message)
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        })
    }
})
