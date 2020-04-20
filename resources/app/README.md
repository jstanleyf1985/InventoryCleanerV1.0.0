ABOUT THIS PROGRAM
Inventory Cleaner is designed to be used internally by staff but can be operated by customers. It has been written in nodeJS and tested in windows environments.

WHY INVENTORY CLEANER WAS CREATED
It was created because certain programs will not allow the upload of files that invalid item numbers. The item numbers can inherently look the same or similar to known good item numbers thus making it difficult for staff to weed out the problem inventory item numbers. This program helps to alleviate that by providing a list of rejects that can be removed and checked for to improve inventory maintenance or inventory uploads in the future.

HOW INVENTORY CLEANER WORKS
Inventory cleaner is a program built to compare a basic text or csv file to a database or database reference file and clean out non matching entries found in the database. It has 2 modes which are file mode and database mode. In file mode the application expects an inventory file using the pattern of itemnumber and count separated by a space or comma separated by line returns. It also requires a database reference file which is simple a list of item numbers separated by new lines. The second mode of operation is database mode. In database mode the application requires an inventory file as listed above, yet the second component is department listed in ones database. The program will fetch the department inventory items based on provided database credentials and department name.

Inventory cleaner will filter out matches and non matches essentially cleaning up the inventory file. It will then allow the saving of the clean file and a dirty file. The dirty file will list rejects and the reason why they were rejected. The clean file should have all rejects removed from the file so that it can be ready for upload into the software. 

HOW TO USE THIS PROGRAM IN MANUAL MODE (NO DATABASE CONFIGURATION)
    1.) Open the program.
    2.) Remove any database configurations if they are present by selecting the delete button next in the main program window. If it allows you to delete the file it will reload without the database mode enabled.
    3.) If no database configurations are detected the system automatically changes to manual mode.
    4.) Press the "Add Inventory File" button and select your inventory upload file.
    5.) Press the "Add Database File" button and select your database reference file.
    6.) To obtain the database reference file you'll need to copy the query by selecting the "How to use this program" button and selecting copy database query. Replace the department with your real department name and run a query. Save that into notepad as a text file.
    7.) Press the "Get Clean Inventory File" button to generate the file and save it somewhere.
    8.) An optional "Get Invalid Inventory File" is available if you desire to save the invalid entries.
    9.) Press the "Save and Reload" button to enter more.

HOW TO USE THIS PROGRAM IN DATABASE MODE (DATABASE CONFIGURATION IS PROVIDED)
    1.) Open the program.
    2.) Select "Add Database Configuration" if one is not present. If present it will say "Change Database Configuration".
    3.) Select "Select Department" button and select a department from the list of database generated departments.
    4.) Press the "Get Clean Inventory File" button to generate the file and save it somewhere.
    5.) An optional "Get Invalid Inventory File" is available if you desire to save the invalid entries.
    6.) Press the "Save and Reload" button to enter more.

QUESTIONS & ANSWERS
How do I get the database reference file?
    1.) Select how to use this program button.
    2.) Select "Copy Database Query".
    3.) Open your SQL database and run a query using the provided text.
    4.) When running the query, replace the department name with your real department name.
    5.) Once ran, copy the list of item numbers and paste them into notepad making sure that each entry is on a new line.
    6.) Save notepad as a text or csv.