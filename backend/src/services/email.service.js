// backend/src/services/email.service.js

import dotenv from 'dotenv';
dotenv.config();

import dayjs from 'dayjs';
import nodemailer from 'nodemailer'; 
import { getDailySummariesForYesterday,getGrandTotalCorrect,isReportSent,setReportSent } from './daily.service.js';

// ADD IMPORTS AND CONFIGURATION
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);

const PACIFIC_TIMEZONE = 'America/Los_Angeles'; // US Pacific Time Zone

// Configuration from environment variables
const REPORT_RECIPIENT = process.env.DAILY_REPORT_EMAIL;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS, // App Password
    }
});

/**
 * Sends an email report using Nodemailer.
 */
export async function sendDailyReport() {
    if (!REPORT_RECIPIENT || !GMAIL_USER || !GMAIL_PASS) {
        console.warn('Skipping daily report email: Email credentials or recipient missing in environment variables.');
        return;
    }
    
    console.log(`--- Starting Daily Report Job for ${REPORT_RECIPIENT} ---`);

    const yesterday = dayjs().tz(PACIFIC_TIMEZONE).subtract(1, 'day');
    const yesterdayFormatted = yesterday.format('YYYY-MM-DD');
     // --- FIX: Persistent check to prevent double-send on server restart ---
    if (await isReportSent(yesterdayFormatted)) {
        console.log(`Daily report already sent for ${yesterdayFormatted}. Skipping.`);
        return; 
    }
    console.log(`--- Starting Daily Report Job for ${REPORT_RECIPIENT} ---`);
    const summaries = await getDailySummariesForYesterday();

    if (summaries.length === 0) {
        console.log('No activity recorded yesterday. Email not sent.');
        await setReportSent(yesterdayFormatted);
        return;
    }

    // --- FEATURE: Build array of augmented summaries including Grand Total ---
    const augmentedSummaries = await Promise.all(summaries.map(async (summary) => {
        const grandTotal = await getGrandTotalCorrect(summary.user._id);
        return { ...summary, grandTotal };
    }));
    
    // Build email content (both plain text and HTML)
    let reportBody = `Daily Math Facts Summary Report - ${yesterdayFormatted}\n\n`;
    let htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4CAF50;">Daily Math Facts Report</h2>
            <p>Date: <strong>${yesterdayFormatted}</strong></p>
            <p>Below is a summary of the math quiz activity from your child(ren):</p>
            <hr style="border: 0; border-top: 1px solid #eee;">
    `;
    
    augmentedSummaries.forEach(summary => { 
        const userName = summary.user?.name || 'Unknown User';
        const userPin = summary.user?.pin || 'N/A';
        const timeInMinutes = (summary.totalActiveMs / 60000).toFixed(2);
        const grandTotal = summary.grandTotal || 0; 
        
        reportBody += `Child: ${userName} (PIN: ${userPin})\n`;
        reportBody += `  Correct Answers (Today): ${summary.correctCount}\n`;
        reportBody += `  Active Time: ${timeInMinutes} minutes\n`;
        reportBody += `  Grand Total Score: ${grandTotal}\n\n`; // <-- ADDED Grand Total to Text

        htmlBody += `
            <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid #2196F3; background-color: #f9f9f9;">
                <p style="margin: 0;"><strong>Child: ${userName}</strong> (PIN: ${userPin})</p>
                <ul style="list-style-type: none; padding: 0; margin-top: 5px;">
                    <li>✅ Correct Answers (Today): <strong style="color: #4CAF50;">${summary.correctCount}</strong></li>
                    <li>⏱️ Active Time: <strong style="color: #FF9800;">${timeInMinutes} minutes</strong></li>
                    <li>🏆 Grand Total Score: <strong style="color: #FFD700;">${grandTotal}</strong></li> </ul>
            </div>
        `;
    });
    
    htmlBody += `<p style="margin-top: 20px; font-size: 0.8em; color: #777;">Report automatically generated. Please do not reply to this email.</p></div>`;


     const mailOptions = {
        from: `Maths-Fact Report <${GMAIL_USER}>`,
        to: REPORT_RECIPIENT, 
        subject: `Daily Math Report for ${yesterdayFormatted}`,
        text: reportBody,
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        // --- FIX: Set persistence flag after successful send ---
        await setReportSent(yesterdayFormatted);
        // --- END FIX ---
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw new Error('Nodemailer failed to send email. Check your GMAIL_PASS (App Password) and GMAIL_USER credentials.');
    }
}

/**
 *  Sends an immediate email report for video rating.
 */
export async function sendRatingReport(user, rating, level, beltOrDegree) {
    if (!REPORT_RECIPIENT || !GMAIL_USER || !GMAIL_PASS) {
        console.warn('Skipping rating report email: Email credentials or recipient missing in environment variables.');
        return;
    }

    const todayFormatted = dayjs().tz(PACIFIC_TIMEZONE).format('YYYY-MM-DD HH:mm:ss (PST/PDT)');
    const userName = user.name || 'Unknown User';
    const userPin = user.pin || 'N/A';
    const subject = `Video Rated: ${userName} - ${rating}/10 on L${level} ${beltOrDegree} Belt`;
    
    const reportBody = `
Child: ${userName} (PIN: ${userPin})
Date: ${todayFormatted}
Level Completed: L${level} ${beltOrDegree} Belt
Video Rating: ${rating}/10
`;
    
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4CAF50;">Immediate Video Rating Report</h2>
            <p><strong>Child:</strong> ${userName} (PIN: ${userPin})</p>
            <p><strong>Date:</strong> ${todayFormatted}</p>
            <p><strong>Level Completed:</strong> L${level} ${beltOrDegree} Belt</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
            <p style="font-size: 24px; font-weight: bold; color: #2196F3;">Video Rating: <span style="color: #FF9800;">${rating}/10</span></p>
            <p style="margin-top: 20px; font-size: 0.8em; color: #777;">Report automatically generated. Please do not reply to this email.</p>
        </div>
    `;

    const mailOptions = {
        from: `Maths-Fact Report <${GMAIL_USER}>`,
        to: REPORT_RECIPIENT, 
        subject: subject,
        text: reportBody,
        html: htmlBody,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('❌ Error sending rating email:', error.message);
        throw new Error('Nodemailer failed to send rating email.');
    }
}