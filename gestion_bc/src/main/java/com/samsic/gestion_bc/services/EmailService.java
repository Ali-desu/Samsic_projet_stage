package com.samsic.gestion_bc.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendOtpEmail(String to, String token){
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            String resetLink = "https://samsic.vercel.app/app/set-password?token=" + token;
            String htmlContent = "<h3>Welcome to the Gestion BC Platform!</h3>" +
                    "<p>Please click the link below to set your password:</p>" +
                    "<a href=\"" + resetLink + "\">Set Password</a>" +
                    "<p>This link will expire in 24 hours.</p>";

            helper.setTo(to);
            helper.setSubject("Set Your Password");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (Exception e)
            {log.error("Failed to send OTP email to {}: {}", to, e.getMessage(), e);
        }
    }
}