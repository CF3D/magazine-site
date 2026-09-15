MAGAZINE READER — AUTO FOLDER SCAN
====================================

This version automatically scans the Magazines folder every time the website loads.
You do NOT need to edit magazines.json and you do NOT need to choose the folder in a picker.

Folder structure
----------------

Magazines/
  01/
    1.jpg   <- cover
    2.jpg   <- spread page 1
    3.jpg   <- spread page 2
    4.jpg   <- next spread page 1
    5.jpg   <- next spread page 2
  02/
    1.jpg
    2.jpg
    3.jpg
    ...

The issue folders can be named 01, 02, 03, 2025-01, Vogue-01, etc.

How to run
-----------

The browser security model does not let a normal static HTML file silently read
arbitrary directories on your computer. Therefore this package includes a tiny
Python server which scans the folder for the site.

1. Put your JPGs into the Magazines folders.
2. Open a terminal in this folder.
3. Run:

   python3 server.py

4. Open:

   http://localhost:8080/

On Windows, if "python3" is not available, use:

   python server.py

The library is scanned on every page load, so adding a new magazine folder and
refreshing the page makes it appear automatically.

Spread behaviour
----------------

1.jpg = cover
2.jpg + 3.jpg = spread
4.jpg + 5.jpg = spread
6.jpg + 7.jpg = spread
...

If there is an odd final page, it is shown on its own.

Mobile
------

Swipe left/right to move between spreads.
Tap the left/right side of the reader.
Use the thumbnail strip.

Desktop
-------

Arrow Left / Arrow Right to navigate.
F = fullscreen.
Click left/right side of the reader.

Hosting
-------

For a public website, the same idea can be implemented in Node/PHP/etc.
The included Python server is intentionally tiny and dependency-free.
