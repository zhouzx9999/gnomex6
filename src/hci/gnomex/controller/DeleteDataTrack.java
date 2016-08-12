package hci.gnomex.controller;

import hci.framework.control.Command;
import hci.framework.control.RollBackCommandException;
import hci.gnomex.model.DataTrack;
import hci.gnomex.model.DataTrackFolder;
import hci.gnomex.model.UnloadDataTrack;
import hci.gnomex.utility.HibernateSession;
import hci.gnomex.utility.PropertyDictionaryHelper;

import java.io.Serializable;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.hibernate.Session;
import org.apache.log4j.Logger;

public class DeleteDataTrack extends GNomExCommand implements Serializable {
  
 
  
  // the static field for logging in Log4J
  private static Logger LOG = Logger.getLogger(DeleteDataTrack.class);
  
  
  private Integer      idDataTrack = null;
  private String       serverName = null;
  private String       baseDir = "";
 
  
  
  public void validate() {
  }
  
  public void loadCommand(HttpServletRequest request, HttpSession session) {
    
   if (request.getParameter("idDataTrack") != null && !request.getParameter("idDataTrack").equals("")) {
     idDataTrack = new Integer(request.getParameter("idDataTrack"));
   } else {
     this.addInvalidField("idDataTrack", "idDataTrack is required.");
   }
   serverName = request.getServerName();

  }

  public Command execute() throws RollBackCommandException {
    Session sess = null;
    DataTrack dataTrack = null;
    baseDir = PropertyDictionaryHelper.getInstance(sess).getDirectory(serverName, null, PropertyDictionaryHelper.PROPERTY_DATATRACK_DIRECTORY);
    
    try {
      sess = HibernateSession.currentSession(this.getUsername());
      dataTrack = (DataTrack)sess.load(DataTrack.class, idDataTrack);
      
      // Check permissions
      if (this.getSecAdvisor().canDelete(dataTrack)) {
        dataTrack = DataTrack.class.cast(sess.load(DataTrack.class, idDataTrack));


        // insert dataTrack reload entry which will cause
        // das/2 type to be unloaded on next 'das2 reload' request
        // Note:  If dataTrack is under more than one folder, there
        // can be multiple das/2 types for one dataTrack.
        for(DataTrackFolder folder : (Set<DataTrackFolder>)dataTrack.getFolders()) {
          String path = folder.getQualifiedTypeName();
          if (path.length() > 0) {
            path += "/";
          }
          String typeName = path + dataTrack.getName();

          UnloadDataTrack unload = new UnloadDataTrack();
          unload.setTypeName(typeName);
          unload.setIdAppUser(this.getSecAdvisor().getIdAppUser());
          unload.setIdGenomeBuild(dataTrack.getIdGenomeBuild());

          sess.save(unload);
        }

        //
        // Delete (unlink) collaborators
        //
        dataTrack.setCollaborators(null);
        sess.flush();

        // remove dataTrack files
        dataTrack.removeFiles(baseDir);

        // delete database object
        sess.delete(dataTrack);

        sess.flush();
        
        this.xmlResult = "<SUCCESS/>";
        setResponsePage(this.SUCCESS_JSP);
   
      } else {
        this.addInvalidField("insufficient permission", "Insufficient permissions to delete data track.");
        setResponsePage(this.ERROR_JSP);
      }
    } catch (Exception e){
      LOG.error("An exception has occurred in DeleteDataTrack ", e);

      throw new RollBackCommandException(e.getMessage());
        
    }finally {
      try {
        HibernateSession.closeSession();        
      } catch(Exception e) {
        
      }
    }
    
    return this;
  }
}