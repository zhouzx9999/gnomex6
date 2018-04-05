package hci.gnomex.controller;

import hci.gnomex.constants.Constants;
import hci.gnomex.model.Analysis;
import hci.gnomex.model.DataTrack;
import hci.gnomex.model.Request;
import hci.gnomex.model.Topic;
import hci.gnomex.utility.*;
import org.apache.log4j.Logger;
import org.hibernate.Session;
import org.hibernate.query.Query;

import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonWriter;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

public class GetGNomExOrderFromNumberServlet extends HttpServlet {
    private static Logger LOG = Logger.getLogger(GetGNomExOrderFromNumberServlet.class);

    private String requestNumber;
    private String dataTrackNumber;
    private String topicNumber;
    private String analysisNumber;
    private static String webContextPath;



    protected static void initLog4j() {
        String configFile = "";
        configFile = webContextPath + "/WEB-INF/classes/" + Constants.LOGGING_PROPERTIES;
        org.apache.log4j.PropertyConfigurator.configure(configFile);
        if (configFile == null) {
            System.err.println("[GNomExFrontController] No configuration file specified for log4j!");
        }
        org.apache.log4j.PropertyConfigurator.configure(configFile);
    }

    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        webContextPath = config.getServletContext().getRealPath(Constants.FILE_SEPARATOR);

        initLog4j();

        // we should only do this once
    } // end of init


    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        Session sess = null;
        try {
            JsonObject value = null;
            requestNumber = req.getParameter("requestNumber");
            analysisNumber = req.getParameter("analysisNumber");
            dataTrackNumber = req.getParameter("dataTrackNumber");
            topicNumber = req.getParameter("topicNumber");

            sess = HibernateSession.currentReadOnlySession("guest");
            PropertyDictionaryHelper.getInstance(sess);


            if(requestNumber != null){
                String requestNumberBase = Request.getBaseRequestNumber(requestNumber);

                String  queryStr = "SELECT req from Request as req where req.number like ? OR req.number = ?";
                Query query = sess.createQuery(queryStr).setParameter(0 , requestNumberBase + "%" )
                              .setParameter(1, requestNumberBase );
                List reqRow = query.list();

                Request r = (Request)reqRow.get(0);
                value = Json.createObjectBuilder()
                        .add("result", "SUCCESS")
                        .add("requestNumber", r.getNumber())
                        .add("codeVisbility", r.getCodeVisibility())
                        .add("idRequest", r.getIdRequest())
                        .add("idProject", r.getIdProject())
                        .add("idLab", r.getIdLab())
                        .build();


            }else if(analysisNumber != null){
                analysisNumber = analysisNumber.replaceAll("#", "");
                System.out.println("analysisNumber: " + analysisNumber );

                String queryStr ="SELECT a from Analysis as a where a.number = :analysisNumber" ;
                Query query = sess.createQuery(queryStr).setParameter("analysisNumber", analysisNumber );
                List analysisRow = query.list();

                Analysis a = (Analysis)analysisRow.get(0);
                value = Json.createObjectBuilder()
                        .add("result", "SUCCESS")
                        .add("analysisNumber", a.getNumber())
                        .add("codeVisbility", a.getCodeVisibility())
                        .add("idAnalysis", a.getIdAnalysis())
                        .add("idLab", a.getIdLab())
                        .build();


            }else if(dataTrackNumber != null){
                dataTrackNumber = dataTrackNumber.replaceAll("#", "");
                dataTrackNumber.toUpperCase();
                System.out.println("dataTrackNumber: " + dataTrackNumber );


                String queryStr = "SELECT dt.fileName, dt.codeVisibility, dt.idDataTrack, dt.idLab,dt.idGenomeBuild, gb.idOrganism " +
                                  "FROM DataTrack as dt JOIN dt.folders as dtfold JOIN dtfold.genomeBuild as gb " +
                                   "WHERE dt.fileName = :dataTrackNumber";
                Query query = sess.createQuery(queryStr).setParameter("dataTrackNumber" , dataTrackNumber );
                List<Object[]> dtResults = query.list();



                Object[] dtRow = dtResults.get(0);
                value = Json.createObjectBuilder()
                        .add("result", "SUCCESS")
                        .add("dataTrackNumber", (String)dtRow[0])
                        .add("codeVisibility", (String)dtRow[1])
                        .add("idDataTrack", (Integer)dtRow[2])
                        .add("idLab",(Integer)dtRow[3])
                        .add("idGenomeBuild",(Integer)dtRow[4])
                        .add("idOrganism",(Integer)dtRow[5])
                        .build();

            }else if(topicNumber != null){
                topicNumber = topicNumber.replaceAll("[A-Za-z#]*]", "");
                System.out.println("topicNumber: " + topicNumber );

                String  queryStr = "SELECT t from Topic as t where t.idTopic = :topicNumber";

                Query query = sess.createQuery(queryStr).setParameter("topicNumber" , topicNumber );
                List topicRow = query.list();

                Topic t = (Topic)topicRow.get(0);
                value = Json.createObjectBuilder()
                        .add("result", "SUCCESS")
                        .add("topicNumber", t.getNumber())
                        .add("codeVisbility", t.getCodeVisibility())
                        .add("idTopic", t.getIdTopic())
                        .add("idLab", t.getIdLab())
                        .build();

            }

            JsonWriter jsonWriter = Json.createWriter(res.getOutputStream());
            res.setContentType("application/json");
            jsonWriter.writeObject(value);
            jsonWriter.close();




        } catch (Exception e) {
            LOG.error("An error occurred in GetGNomExOrderFromNumberServlet", e);
            res.addHeader("message", e.getMessage());

            JsonObject value = Json.createObjectBuilder()
                    .add("ERROR", e.getMessage())
                    .build();
            JsonWriter jsonWriter = Json.createWriter(res.getOutputStream());

            res.setContentType("application/json");
            jsonWriter.writeObject(value);
            jsonWriter.close();

        }finally {
            if (sess != null) {
                try {
                    HibernateSession.closeSession();
                } catch (Exception e) {
                    LOG.error("An error occurred in GetGNomExOrderFromNumberServlet", e);
                }
            }
            res.setHeader("Cache-Control", "max-age=0, must-revalidate");

        }

    }

    /*
     * SPECIAL NOTE - This servlet must be run on non-secure socket layer (http) in order to keep track of previously created session. (see note below concerning
     * flex upload bug on Safari and FireFox). Otherwise, session is not maintained. Although the code tries to work around this problem by creating a new security
     * advisor if one is not found, the Safari browser cannot handle authenicating the user (this second time). So for now, this servlet must be run non-secure.
     */
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {

    }



}
