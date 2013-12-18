package org.geppetto.frontend;

import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class SendEmail {
		
	private static SendEmail instance = null;
	
	private static Properties props = null;

	
	public static SendEmail getInstance(){
		if(instance == null){
			instance = new SendEmail();
		}
		
		return instance;
	}



	private Session session;
	

	
	public void sendEmails(ConcurrentHashMap<String, String> waitingUsers){
                    
		for(String name : waitingUsers.keySet()){
			
			String email = waitingUsers.get(name);
			
			Session session = getSession();

	        String msgBody = "...";

	        try {
	            Message msg = new MimeMessage(session);
	            msg.setFrom(new InternetAddress("yeshuarmartinez@gmail.com", "El mas Cabron Admin"));
	            msg.addRecipient(Message.RecipientType.TO,
	                             new InternetAddress(email, name));
	            msg.setSubject("A spot in Geppetto Simulator just became available");
	            msg.setText(msgBody);
	            Transport.send(msg);

	        } catch (AddressException e) {
	           e.printStackTrace();
	        } catch (MessagingException e) {
	        	e.printStackTrace();
	        } catch (UnsupportedEncodingException e) {
				// TODO Auto-generated catch block
	        	e.printStackTrace();
			}
		}
	}



	private Session getSession() {
		if(session == null){
			// TODO Auto-generated method stub
			try  {
				props = new Properties();
				props.load(SendEmail.class.getResourceAsStream("/mail.properties"));
			} catch  (Exception e) {
				e.printStackTrace();
			}

			session  = Session.getInstance(props, new Authenticator(){
				protected PasswordAuthentication getPasswordAuthentication()
				{
					return new PasswordAuthentication(
							(String)props.get("mail.login.username"), 
							(String)props.get("mail.login.password"));
				}
			});
		}
		
		return session;
	}
}
