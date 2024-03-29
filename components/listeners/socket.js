// exports = module.exports = function(io){
import axios from "axios";
export default function (io) {
  var map = [];

  io.on("connection", (socket) => {
    var pdfInfo = {
      pdfStatus: 0,
      pdfId: "",
    };

    var room = null;
    var username = "";

    var current_student_permission = "student";
    var zoom_pdf = 1;
    var scroll_position = {
      ratioX: null,
      ratioY: null,
    };

    var linkGgMeet = null;

    var map_index = null;

    //console.log("A user connected");
    socket.on("get-room-info", (roomInfo) => {
      room = roomInfo.roomId;
      username = roomInfo.username;
      const type = roomInfo.type;
      if (!socket.rooms.has(room)) socket.join(room);
      // const roomPdf = map.forEach((pdf) => pdf.room === room);
      let roomPdf = null;
      for (let pdf of map) if (pdf.room === room) roomPdf = pdf;
      for (let i = 0; i < map.length; i++)
        if (map[i].room === room) {
          map_index = i;
          break;
        }
      if (roomPdf) {
        //console.log("return")
        //console.log(map_index)
        pdfInfo = roomPdf.pdfInfo;
        zoom_pdf = roomPdf.zoom_pdf;
        scroll_position = roomPdf.scroll_position;
        current_student_permission = roomPdf.current_student_permission;
        linkGgMeet = roomPdf.linkGgMeet;

        // io.to(room).emit("get-pdf-status", roomPdf.pdfInfo);
        // io.to(room).emit("set-role", {role: roomPdf.current_student_permission});
        // io.to(room).emit("pdf-current-zoom", { value: roomPdf.zoom_pdf });
        // io.to(room).emit("sync-scrolling-pdf-first-access", roomPdf.scroll_position);
        // if(type === "call")
        //   io.to(room).emit("redirect-meeting", {linkMeeting: roomPdf.linkGgMeet})
        socket.emit("get-pdf-status", roomPdf.pdfInfo);
        socket.emit("set-role", { role: roomPdf.current_student_permission });
        socket.emit("pdf-current-zoom", { value: roomPdf.zoom_pdf });
        socket.emit("sync-scrolling-pdf-first-access", roomPdf.scroll_position);
        if (type === "call")
          socket.emit("redirect-meeting", { linkMeeting: roomPdf.linkGgMeet });
      } else {
        var user = {};
        user.pdfInfo = pdfInfo;
        user.zoom_pdf = zoom_pdf;
        user.scroll_position = scroll_position;
        user.room = room;
        user.current_student_permission = current_student_permission;
        user.linkGgMeet = linkGgMeet;

        // map = map.filter((pdf) => pdf.room !== room);
        console.log(user);

        map.push(user);
        map_index = map.length - 1;
      }
    });

    //-----------PDF FILE CHOSEN---------------
    // socket.to(room).emit("get-pdf-status", pdfInfo);
    //socket.to(room).emit("pdf", pdfInfo);

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
      current_student_permission = "student"
      console.log("Change-status "+ room)
      map.forEach((pdf) => {
        if (pdf.room === room) {
          pdf.pdfInfo = pdfInfo;
          pdf.zoom_pdf = zoom_pdf;
          pdf.scroll_position = scroll_position;
          pdf.current_student_permission = current_student_permission;
        }

      });
      // var user = {};
      // user.pdfInfo = pdfInfo;
      // user.zoom_pdf = zoom_pdf;
      // user.scroll_position = scroll_position;
      // user.room = room;
      // user.current_student_permission = current_student_permission

      // map = map.filter((pdf) => pdf.room !== room);

      // map.push(user);
      //console.log(map);

      socket.broadcast.to(room).emit("pdf", pdfInfo);
      // socket.emit("get-pdf-status", pdfInfo);
    });

    //------------PERMISSION----------------
    socket.on("allowance", (role) => {
      current_student_permission = role.role;
      map.forEach((pdf) => {
        if (pdf.room === room)
          pdf.current_student_permission = current_student_permission;
      });
      socket.broadcast.to(room).emit("set-role", role);
    });

    if (current_student_permission !== "")
      socket.to(room).emit("set-role", current_student_permission);

    //---------------ZOOM-------------
    socket.on("pdf-zoom", (e) => {
      zoom_pdf = e.value;
      map.forEach((pdf) => {
        if (pdf.room === room) pdf.zoom_pdf = zoom_pdf;
      });
      socket.broadcast.to(room).emit("change-pdf-zoom", { value: zoom_pdf });
    });

    // socket.to(room).emit("pdf-current-zoom", { value: zoom_pdf });

    //-----------------------------------SCROLL--------------------------------------
    socket.on("scrolling-pdf", (e) => {
      scroll_position.ratioX = e.ratioX;
      scroll_position.ratioY = e.ratioY;
      //console.log(scroll_position)
      map.forEach((pdf) => {
        if (pdf.room === room) pdf.scroll_position = scroll_position;
      });

      if (scroll_position.ratioX !== null && scroll_position.ratioY !== null)
        socket.broadcast.to(room).emit("sync-scrolling-pdf", scroll_position);
    });

    // if (scroll_position.ratioX !== null && scroll_position.ratioY !== null) {
    //   // const roomPdf = map.forEach(pdf => pdf.room === room)
    //   socket.to(room).emit("sync-scrolling-pdf-first-access", scroll_position);
    // }

    socket.on("create-redirect-meeting", (link) => {
      linkGgMeet = link.linkMeeting;
      console.log(map[map_index]);
      map[map_index].linkGgMeet = link.linkMeeting;
      setTimeout(() => (map[map_index].linkGgMeet = null), 1800000);
      socket.broadcast
        .to(room)
        .emit("redirect-meeting", { linkMeeting: linkGgMeet });
    });

    socket.on("remove-redirect-meeting", (data) => {
      console.log("cancel");
      console.log(map[map_index]);

      linkGgMeet = null;
      map[map_index].linkGgMeet = null;

      socket.broadcast
        .to(room)
        .emit("cancel-redirect-meeting", { linkMeeting: linkGgMeet });
    });

    socket.on("disconnect", async () => {
      if (
        username !== undefined &&
        username !== "" &&
        username !== "undefined"
      ) {
        await axios
          .post("https://chat3.virtedy.com/api/v1/login", {
            // username: process.env.USER_ADMIN,
            // password: process.env.PASSWORD_ADMIN,
            username: "nghianguyen",
            password: "12345678",
          })
          .then(async function (responseMain) {
            if (responseMain.data.status === "success") {
              const authTokenAdmin = responseMain.data.data.authToken;
              const userIdAdmin = responseMain.data.data.userId;
              await axios.post(
                `https://chat3.virtedy.com/api/v1/chat.postMessage`,
                {
                  channel: room,
                  alias: " ",
                  emoji: ":none:",
                  text: `**${username}** offline`,
                },
                {
                  headers: {
                    "X-Auth-Token": authTokenAdmin,
                    "X-User-Id": userIdAdmin,
                  },
                }
              );
            }
          })
          .catch(function () {
            console.log("AUTH FAIL");
            //res.sendStatus(401);
          });
      }
      console.log("A user disconnected");
    });
  });
}
