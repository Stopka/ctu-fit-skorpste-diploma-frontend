package cz.cvut.skorpste.dip.frontend;

import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;

import com.oreilly.servlet.ServletUtils;
import org.apache.log4j.Logger;

/**
 * Views files requested by given path from webapp folder
 */
public class ViewFile extends HttpServlet {
    static Logger logger=Logger.getLogger(ViewFile.class);

    /**
     * Returns requested file from webapp folder
     * @param req
     * @param res
     * @throws ServletException
     * @throws IOException
     */
    public void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        // Use a ServletOutputStream because we may pass binary information
        ServletOutputStream out = res.getOutputStream();

        // Get the file to view
        String file = req.getPathTranslated();
        logger.info(file);
        // No file, nothing to view
        if (file == null) {
            out.println("No file to view");
            return;
        }

        // Get and set the type of the file
        String contentType = getServletContext().getMimeType(file);
        res.setContentType(contentType);

        // Return the file
        try {
            ServletUtils.returnFile(file, out);
        }
        catch (FileNotFoundException e) {
            out.println("File not found");
            res.sendRedirect("/search.html");
        }
        catch (IOException e) {
            out.println("Problem sending file: " + e.getMessage());
        }
    }
}