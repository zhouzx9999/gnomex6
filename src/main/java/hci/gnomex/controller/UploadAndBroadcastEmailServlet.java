package hci.gnomex.controller;

import hci.gnomex.model.AppUser;
import hci.gnomex.model.PropertyDictionary;
import hci.gnomex.security.SecurityAdvisor;
import hci.gnomex.utility.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.hibernate.Session;
import org.hibernate.query.Query;

import com.oreilly.servlet.multipart.FilePart;
import com.oreilly.servlet.multipart.MultipartParser;
import com.oreilly.servlet.multipart.ParamPart;
import com.oreilly.servlet.multipart.Part;

public class UploadAndBroadcastEmailServlet extends HttpServlet {

    private static String serverName;

    private static final int STATUS_ERROR = 999;
    private static final Logger LOG = Logger.getLogger(UploadAndBroadcastEmailServlet.class);

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        doPost(req, res);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        // Restrict commands to local host if request is not secure
        if (!ServletUtil.checkSecureRequest(req)) {
            ServletUtil.reportServletError(res, "Secure connection is required. Prefix your request with 'https'");
            return;
        }

        try {
            String subject = "GNomEx announcement";
            String fromAddress = "";
            StringBuffer body = null;
            String format = "text";

            serverName = req.getServerName();
            Session sess = HibernateSession.currentReadOnlySession((req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "guest"));

            // Get the dictionary helper
            DictionaryHelper dh = DictionaryHelper.getInstance(sess);

            // Get security advisor
            SecurityAdvisor secAdvisor = (SecurityAdvisor) req.getSession().getAttribute(SecurityAdvisor.SECURITY_ADVISOR_SESSION_KEY);
            if (secAdvisor == null) {
                System.out.println("UploadAndBroadcaseEmailServlet:  Warning - unable to find existing session. Creating security advisor.");
                secAdvisor = SecurityAdvisor.create(sess, (req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "guest"));
            }

            if (secAdvisor == null) {
                System.out.println("UploadAndBroadcaseEmailServlet: Error - Unable to find or create security advisor.");
                throw new ServletException("Unable to upload analysis file.  Servlet unable to obtain security information. Please contact GNomEx support.");
            }

            // Only gnomex admins can send broadcast emails
            if (!secAdvisor.hasPermission(SecurityAdvisor.CAN_ACCESS_ANY_OBJECT)) {
                throw new ServletException("Insufficent permissions");
            }

            // Get a list of all active users with email accounts for selected cores.
            String appUserQueryString = "SELECT DISTINCT a from AppUser a join a.labs l join l.coreFacilities c "
                    + " where a.isActive = 'Y' and a.email is not NULL and a.email != '' and c.idCoreFacility in (:ids) ORDER BY a.lastName, a.firstName ";
            ArrayList<Integer> coreIds = new ArrayList<>();

            if (req.getParameter("coreFacilityIds") != null && !req.getParameter("coreFacilityIds").equals("")) {
                String idsFromReq = req.getParameter("coreFacilityIds");
                coreIds.addAll(this.parseCoreFacilityIDs(idsFromReq));
            } else {
                coreIds.add(-1);
            }

            if (req.getParameter("body") != null && !req.getParameter("body").equals("")) {

                body = new StringBuffer(req.getParameter("body"));

                if (req.getParameter("subject") != null && !req.getParameter("subject").equals("")) {
                    subject = req.getParameter("subject");
                }
                if (req.getParameter("fromAddress") != null && !req.getParameter("fromAddress").equals("")) {
                    fromAddress = req.getParameter("fromAddress");
                }
                if (req.getParameter("format") != null && !req.getParameter("format").equals("")) {
                    format = req.getParameter("format");
                }

            } else {
                MultipartParser mp = new MultipartParser(req, Integer.MAX_VALUE);
                Part part;
                while ((part = mp.readNextPart()) != null) {
                    String name = part.getName();
                    if (part.isParam()) {
                        // it's a parameter part
                        ParamPart paramPart = (ParamPart) part;
                        String value = paramPart.getStringValue();

                        if (name.equals("format")) {
                            format = value;
                        } else if (name.equals("subject")) {
                            subject = value;
                        } else if (name.equals("fromAddress")) {
                            fromAddress = value;
                        } else if (name.equals("coreFacilityIds")) {
                            coreIds.clear();
                            coreIds.addAll(this.parseCoreFacilityIDs(value));
                        }

                    } else if (part.isFile()) {
                        FilePart filePart = (FilePart) part;
                        InputStream is = filePart.getInputStream();

                        if (is == null) {
                            throw new ServletException("Empty input stream.");
                        }

                        String line;
                        body = new StringBuffer();
                        try {
                            BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                            while ((line = reader.readLine()) != null) {
                                body.append(line).append("\n");
                            }
                        } finally {
                            is.close();
                        }
                    }
                }

            }

            Query appUserQuery = sess.createQuery(appUserQueryString);
            appUserQuery.setParameterList("ids", coreIds);
            List appUsers = appUserQuery.list();

            int userCount = 0;
            List<String> invalidEmails = new ArrayList<>();
            if (body != null && body.length() > 0) {

                for (Iterator i = appUsers.iterator(); i.hasNext(); ) {
                    AppUser appUser = (AppUser) i.next();

                    String emailRecipients = appUser.getEmail();
                    if (!MailUtil.isValidEmail(emailRecipients)) {
                        invalidEmails.add(emailRecipients);
                        continue;
                    }

                    // Email app user
                    if (!MailUtil.isValidEmail(fromAddress)) {
                        fromAddress = DictionaryHelper.getInstance(sess).getPropertyDictionary(
                                PropertyDictionary.GENERIC_NO_REPLY_EMAIL);
                    }

                    MailUtilHelper helper = new MailUtilHelper(emailRecipients, fromAddress, subject, body.toString(), null, format.equalsIgnoreCase("HTML"), dh, serverName);
                    helper.setRecipientAppUser(appUser);
                    MailUtil.validateAndSendEmail(helper);

                    userCount++;

                }

            }

            res.setHeader("Cache-Control", "max-age=0, must-revalidate");

            String baseURL = "";
            StringBuffer fullPath = req.getRequestURL();
            String extraPath = req.getServletPath() + (req.getPathInfo() != null ? req.getPathInfo() : "");
            int pos = fullPath.lastIndexOf(extraPath);
            if (pos > 0) {
                baseURL = fullPath.substring(0, pos);
            }

            org.dom4j.io.OutputFormat format1 = org.dom4j.io.OutputFormat.createPrettyPrint();
            org.dom4j.io.HTMLWriter writer;
            res.setContentType("text/html; charset=UTF-8");

            Document doc = DocumentHelper.createDocument();
            Element root = doc.addElement("HTML");
            Element head = root.addElement("HEAD");
            Element link = head.addElement("link");
            link.addAttribute("rel", "stylesheet");
            link.addAttribute("type", "text/css");
            link.addAttribute("href", baseURL + "/css/message.css");
            Element body1 = root.addElement("BODY");
            Element h3 = body1.addElement("H3");
            h3.addCDATA("The email has been successfully sent to " + userCount + " GNomEx users.\n\n");
            if (invalidEmails.size() > 0) {
                h3.addCDATA("The email was not sent to the following user(s): ");
                for (Iterator i = invalidEmails.iterator(); i.hasNext(); ) {
                    String email = (String) i.next();
                    h3.addCDATA(email);
                    if (i.hasNext()) {
                        h3.addCDATA(", ");
                    }
                }
            }
            body1.addElement("BR");
            body1.addElement("BR");
            writer = new org.dom4j.io.HTMLWriter(res.getWriter(), format1);
            writer.write(doc);
            writer.flush();
            writer.close();
            res.setStatus(HttpServletResponse.SC_ACCEPTED);

        } catch (Exception e) {
            LOG.error("An exception has occurred in UploadAndBroadcastEmailServlet ", e);
            res.setStatus(STATUS_ERROR);

            throw new ServletException("Unable to send broadcast email due to a server error.  Please contact GNomEx support.");
        } finally {
            try {
                HibernateSession.closeSession();
            } catch (Exception e1) {
                LOG.error("An exception has occurred in UploadAndBroadcastEmailServlet ", e1);
            }
        }
    }

    private Set<Integer> parseCoreFacilityIDs(String value) {
        Set<Integer> parsedIDs = new HashSet<>();
        if (!value.contains(",")) {
            parsedIDs.add(Integer.parseInt(value));
        } else {
            for (String id : value.split(",")) {
                parsedIDs.add(Integer.parseInt(id));
            }
        }
        return parsedIDs;
    }

}
