package hci.gnomex.daemon.auto_import;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.Writer;
import java.util.*;
import java.sql.Timestamp;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class Downloader {


	private String mode;
	private Map<String,List<String>> fileNameMap;
	private String dependentDataPath;
	private String fileOfPaths;

	private String downloadPath;
	private final String rootAvatar = "HCI_Molecular_Data:/";
	private List<String> flaggedFileList;
	private boolean allowClearFile = false;
	private String filterRegex;

	Downloader(String[] args ){
		this.mode = "avatar";
		for (int i = 0; i < args.length; i++) {
			args[i] =  args[i].toLowerCase();
			if (args[i].equals("-filelist")) {
				this.fileOfPaths = args[++i];
				String pattern = Pattern.quote(System.getProperty("file.separator"));
				String[] fileChunks = this.fileOfPaths.split(pattern);
				fileChunks = Arrays.copyOfRange(fileChunks,0,fileChunks.length -1 );
				this.dependentDataPath = String.join(File.separator,fileChunks) + File.separator;

			} else if (args[i].equals("-downloadpath")) {
				this.downloadPath = args[++i];
			} else if (args[i].equals("-mode")) {
				this.mode = args[++i];
				if(!(this.mode.equals("tempus") || this.mode.equals("avatar")) ){
					System.out.println("If you specify mode it has to be either tempus or avatar");
					System.exit(1);
				}

			}else if(args[i].equals("-allowclearfile")){
				this.allowClearFile = true;
			}else if(args[i].equals("-filterregex")){
				filterRegex = args[++i];
			} else if (args[i].equals("-help")) {
				//printUsage();
				System.exit(0);
			}
		}
		if(dependentDataPath == null || downloadPath == null){
			System.out.println("Please specify both the log path and the download path");
			System.exit(1);
		}

		this.fileNameMap = new TreeMap<String,List<String>>();
		this.flaggedFileList = new ArrayList<String>();
	}

	public String getMode(){
		return this.mode;
	}



	private boolean hasSubProccessErrors(File errorFile) {
		Scanner scan = null;
		boolean hasError = false;
		try{
			scan = new Scanner(errorFile);
			System.out.println("************************************************************");
			System.out.println("Errors will appear below if found, in this file, " + errorFile.getName());
			while(scan.hasNext()){
				String line = scan.nextLine();
				if(line.matches(".*Error.*|.*error.*")){
					hasError = false; // temp fix need to rework
					System.out.println(line);
				}

			}
			System.out.println("************************************************************");
		}catch(FileNotFoundException e){
			if(scan != null){ scan.close(); }
			hasError = false;
		}finally {
			scan.close();
		}
		return hasError;
	}

	private void executeCommands(List<String> commands) {

		File tempScript = null;

		try {
			System.out.println("started executing command");
			tempScript = createTempScript(commands);
			ProcessBuilder pb = new ProcessBuilder("bash", tempScript.toString());
			pb.inheritIO();
			Process process;
			File errorFile = new File( dependentDataPath +"download-error.log");
			pb.redirectError(errorFile);

			process = pb.start();
			process.waitFor();
			if(hasSubProccessErrors(errorFile)){
				System.out.println("Error detected exiting script");
				System.exit(1);
			}


			System.out.println("finished executing command");
		}

		catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		finally {
			tempScript.delete();
		}
	}




	private File createTempScript(List<String> commands) throws IOException {
		File tempScript = File.createTempFile("script", null);

		Writer streamWriter = new OutputStreamWriter(new FileOutputStream(tempScript));
		PrintWriter printWriter = new PrintWriter(streamWriter);


		for(int i =0; i < commands.size(); i++) {
			printWriter.println(commands.get(i));
		}

		printWriter.close();

		return tempScript;
	}

	public void executeAvatarDownload() {

		List<String> commands = new ArrayList<String>();

		String parsedDownloadList = prepDownloadString(this.rootAvatar);

		if(parsedDownloadList.equals("unsafe")) { // downloading is in progress, no need to continue
			System.out.println("The process has been aborted because files are already downloading" );
			System.exit(3);
		}



		//["Downloading in Progress..."]
		List<String> status = Arrays.asList("Downloading in progress...");
		writeToFile(this.dependentDataPath + "download.log",status); // /home/u0566434/parser_data/download.log


		// Execute download actually
		String downloadCommand = "dx download " + parsedDownloadList;

		//dx download "project-xxxx:/my_folder/example.bam"
		System.out.println("These command for files to be downloaded: " + downloadCommand);
		commands.add("#!/bin/bash");
		commands.add("cd " + this.downloadPath);
		commands.add("mv -t ." + File.separator + " " +  this.downloadPath + File.separator +"Flagged" + File.separator +  "*" );
		if(!parsedDownloadList.equals("")){
			commands.add(downloadCommand);
		}else{
			System.out.println("No files will be downloaded because there are only flagged files at this time ");
		}


		executeCommands(commands);

		System.out.println("The dowload finished");
		ArrayList<String> downloadedList = new ArrayList<String>();
		Timestamp timestamp = new Timestamp(System.currentTimeMillis());


		downloadedList.add("Dowloaded successfully, " + timestamp );
		downloadedList.add(this.createFormattedPath("", true, true).replace("\"", ""));

		writeToFile(this.dependentDataPath + "download.log", downloadedList);


	}

	public void executeTempusDownload() {
		List<String> commands = new ArrayList<String>();

		List<String> status = Arrays.asList("Downloading in progress...");
		writeToFile(this.dependentDataPath + "download.log",status); // /home/u0566434/parser_data/download.log
		writeToFile(fileOfPaths,this.fileNameMap);

		String downloadCommand = "cat " + this.fileOfPaths + " | xargs -P10 -I {} aws --profile tempus s3 cp {} " + this.downloadPath;
		System.out.println(downloadCommand);
		commands.add(downloadCommand);
		commands.add("mv -t " + this.downloadPath + " " + this.downloadPath + File.separator +  "Flagged" +File.separator +  "*" );
		executeCommands(commands);

		ArrayList<String> downloadedList = new ArrayList<String>();
		Timestamp timestamp = new Timestamp(System.currentTimeMillis());

		downloadedList.add("Dowloaded successfully, " + timestamp );
		downloadedList.add(this.createFormattedPath("", true, true).replace("\"", ""));

		writeToFile(this.dependentDataPath + "download.log", downloadedList);

	}


	private void addToIDMap(String aliasKey, String fullPathFileVal, Map<String, List<String>> idMap){
		if(idMap.get(aliasKey) != null){
			idMap.get(aliasKey).add(fullPathFileVal);
		}else{
			idMap.put(aliasKey, new ArrayList<>(Arrays.asList(fullPathFileVal)));
		}
	}

	public void loadFileNames(){


		FileReader reader = null;
		try {
			reader = new FileReader(new File(this.fileOfPaths));
			BufferedReader buffReader = new BufferedReader(reader);
			Pattern pattern = null;
			Set<String> removedFlaggedSet = new TreeSet<String>();
			Map<String,List<String>> flaggedIDMap = new HashMap<>();


			if(filterRegex != null){
				pattern = Pattern.compile(filterRegex);
			}



			String line = "";
			while((line = buffReader.readLine()) != null) {
				if(!line.trim().equals("")){
					String[] fullPath = line.split("/");
					String fileName = fullPath[fullPath.length - 1];

					if(filterRegex != null){
						Matcher m = pattern.matcher(fileName);
						if(m.matches()){
							String matchedFileName = Differ.constructMatchedFileName(1,3,m, new StringBuilder() );
							addToIDMap(matchedFileName, line, fileNameMap);
						}else{
							System.out.println("Could not match pattern " + pattern.pattern() + " ON text " + fileName );
						}
					}else{
						addToIDMap(fileName, line, fileNameMap);
					}
				}

			}
			if(fileNameMap.size() < 1) {
				throw new Exception("Appears to be no new files to download");
			}
			System.out.println("Total files to download: " + fileNameMap.size());

			this.loadFlaggedFiles(pattern,flaggedIDMap);


			for(Map.Entry<String,List<String>> e : flaggedIDMap.entrySet()){
				String flaggedIDName = e.getKey();
				// only need to remove once
				if(!removedFlaggedSet.add(flaggedIDName)){
					continue;
				}

				this.fileNameMap.remove(flaggedIDName);
				List<String> fileNames = flaggedIDMap.get(flaggedIDName);

				if(fileNames != null){
					for(String fileName : fileNames){
						System.out.println("Filtering out: " + fileName);
						this.flaggedFileList.add(fileName);
					}
				}

			}
			System.out.println("Files to download after excluding already downloaded Flagged Files: " + fileNameMap.size() );

			if(this.allowClearFile){
				writeToFile(this.fileOfPaths, new ArrayList<String>());
			}

		}
		catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}catch (Exception e) {
			System.out.println(e.getMessage());
			try{ reader.close(); } catch(IOException ioExcept){
				System.out.print("Couldn't close the file reader");
			}
			System.exit(2);
		}
		finally{
			try{ reader.close(); }catch(IOException ioExcept){
				System.out.print("Couldn't close the file reader");
			}
		}

	}


	private void loadFlaggedFiles(Pattern pattern, Map<String, List<String>> flaggedIDMap){
		File flaggedFolder = new File(this.downloadPath + "/Flagged/");
		for(File file: flaggedFolder.listFiles()) {
			if (!file.isDirectory()) {
				String flaggedFileName = "";
				if (filterRegex != null) {
					Matcher m = pattern.matcher(file.getName());
					if (m.matches()) {
						flaggedFileName = Differ.constructMatchedFileName(1, 3, m, new StringBuilder());
						if (!mode.equals("avatar")) {
							addToIDMap(flaggedFileName, file.getName(), flaggedIDMap);
						}
					} else {
						System.out.println("Could not match pattern " + pattern.pattern() + " ON text " + file.getName());
					}

				} else {
					flaggedFileName = file.getName();
					if (!mode.equals("avatar")) {
						addToIDMap(flaggedFileName, file.getName(), flaggedIDMap);
					}
				}

				if(mode.equals("avatar")){
					List<String> fileNames = this.fileNameMap.remove(flaggedFileName);

					if (fileNames != null) {
						for (String fileName : fileNames) {
							System.out.println("Filtering out: " + fileName);
							this.flaggedFileList.add(fileName);
						}
					}
				}

			}
		}
	}



	public String prepDownloadString(String root) {
		String strPaths = "unsafe";
		boolean hasNewLines = false;
		boolean safe = downloadSafe();

		if (safe) {
			strPaths = createFormattedPath(root, hasNewLines, false);
		}

		// String fileNameArray = fileNameList.toString().replaceAll("[\\[,\\]]+", "");
		return strPaths;

	}

	private boolean downloadSafe() {
		boolean safe = false;
		PrintWriter writer = null;

		try {
			BufferedReader bf = new BufferedReader(new FileReader(this.dependentDataPath + "download.log")); /// home/u0566434/parser_data/download.log
			String line = bf.readLine();

			if (!line.equals("Downloading in progress...")) { // If downloading in progress it is not 'safe' to continue
				safe = true;
			}

		} catch (FileNotFoundException e) { // File hasn't been created so lets make it
			// TODO Auto-generated catch block
			try {
				writer = new PrintWriter(this.dependentDataPath +"download.log"); // /home/u0566434/parser_data/download.log
				writer.println("Initalized");
				safe = true;

			} catch (FileNotFoundException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}

		} catch (IOException e) {
			e.printStackTrace();
		}finally {
			if(writer != null) {
				writer.close();
			}

		}
		return safe;

	}

	public Map<String,List<String>> getFileNameMap() {
		return fileNameMap;
	}

	public String createFormattedPath(String root, boolean hasNewLine, boolean afterDownload) {
		StringBuilder strBuild = new StringBuilder();
		int count = 0;

		for (Map.Entry<String, List<String>> entry : fileNameMap.entrySet()) {
			List<String> fullPathFileList = entry.getValue();
			for(int i = 0; i <  fullPathFileList.size(); i++){
				String pathFile = fullPathFileList.get(i);

				if(mode.equals("avatar")){
					strBuild.append("\"");
				}

				strBuild.append(root);
				String safeFileName = pathFile.replaceAll(" ", "\\\\");
				strBuild.append(safeFileName);

				if(mode.equals("avatar")){
					strBuild.append("\"");
				}

				if(hasNewLine) {
					strBuild.append("\n");
				} else {
					strBuild.append(" ");
				}
			}
		}

		// flagged files added now, even though they weren't downloaded this attempt. Since they were in the past
		// The flagged files need to be check in db everytime to see if person data was updated  and can now be imported
		if(afterDownload){
			for( int i = 0; i <  this.flaggedFileList.size(); i++){
				String flaggedFileName =  this.flaggedFileList.get(i);
				String safeFileName = flaggedFileName.replaceAll(" ", "\\\\ ");

				strBuild.append(safeFileName);

				if(i == (flaggedFileList.size() - 1) ){
					continue;
				}
				if(hasNewLine) {
					strBuild.append("\n");
				}
				else {
					strBuild.append(" ");
				}

			}

		}


		return strBuild.toString();
	}



	public List<String> readFile(String fileName) throws IOException{
		BufferedReader bf = null;
		List<String> dataFromFileList = new ArrayList();

		try {
			bf = new BufferedReader(new FileReader(fileName));
			String line = "";
			while((line= bf.readLine()) != null) {
				dataFromFileList.add(line);
			}

		} catch (FileNotFoundException e) {
			e.printStackTrace();
		}
		finally {
			bf.close();
		}
		return dataFromFileList;
	}
	public void writeToFile(String fileName, Map<String, List<String>> dataToWrite) {
		PrintWriter writer = null;
		try {
			writer = new PrintWriter(fileName);
			for (Map.Entry<String,List<String>> entry : dataToWrite.entrySet()) {
				for(String val : entry.getValue()){
					writer.println(val);
				}
			}


		} catch (FileNotFoundException e) {
			e.printStackTrace();
		}finally {
			writer.close();
		}

	}

	public void writeToFile(String fileName, List<String> dataToWrite) {
		PrintWriter writer = null;
		try {
			writer = new PrintWriter(fileName);
			for (int i = 0; i < dataToWrite.size(); i++) {
				writer.println(dataToWrite.get(i));
			}


		} catch (FileNotFoundException e) {
			e.printStackTrace();
		}finally {
			writer.close();
		}

	}



}
