// exports = module.exports = function(io){
export default function (io) {
  io.on("connection", (socket) => {
    var pdfInfo = {
      pdfStatus: 0,
      pdfId: "",
    };

    var room = null;

    var current_student_permission = "";
    var zoom_pdf = 1;
    var scroll_position = {
      ratioX: null,
      ratioY: null,
    };

    //console.log("A user connected");
    socket.on("get-room-info", (roomInfo) => {
      room = roomInfo.roomId;
      if (!socket.rooms.has(room)) socket.join(room);
    });

    

    //-----------PDF FILE CHOSEN---------------
    socket.emit("get-pdf-status", pdfInfo);
    // socket.to(room).emit("pdf", pdfInfo);

    socket.on("pdf-status", (pobject) => {
      //pdfStatus = pobject.status;
      pdfInfo = {
        pdfStatus: pobject.status,
        pdfId: pobject.pdfId,
      };
      zoom_pdf = 1;
      scroll_position = {
        ratioX: null,
        ratioY: null,
      };
      socket.broadcast.to(room).emit("pdf", pdfInfo);
      // socket.emit("get-pdf-status", pdfInfo);
    });

    //------------PERMISSION----------------
    socket.on("allowance", (role) => {
      current_student_permission = role;
      socket.broadcast.to(room).emit("set-role", role);
    });

    if (current_student_permission !== "")
      socket.to(room).emit("set-role", current_student_permission);

    //---------------ZOOM-------------
    socket.on("pdf-zoom", (e) => {
      zoom_pdf = e.value;
      socket.broadcast.to(room).emit("change-pdf-zoom", { value: zoom_pdf });
    });

    socket.broadcast.to(room).emit("pdf-current-zoom", { value: zoom_pdf });

    //-----------------------------------SCROLL--------------------------------------
    socket.on("scrolling-pdf", (e) => {
      scroll_position.ratioX = e.ratioX;
      scroll_position.ratioY = e.ratioY;
      //console.log(scroll_position)
      if (scroll_position.ratioX !== null && scroll_position.ratioY !== null)
        socket.broadcast.to(room).emit("sync-scrolling-pdf", scroll_position);
    });
    if (scroll_position.ratioX !== null && scroll_position.ratioY !== null)
      socket.to(room).emit("sync-scrolling-pdf-first-access", scroll_position);

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
}
