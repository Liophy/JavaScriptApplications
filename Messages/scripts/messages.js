function startApp() {
    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewAppHome');

    $("#linkMenuAppHome").click(showHomeView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);

    $("#linkMenuUserHome").click(showHomeViewUser);
    $("#linkMenuMyMessages").click(listMyMessages);
    $("#linkMenuArchiveSent").click(listArchiveSent);
    $("#linkMenuSendMessage").click(showSendMessageView);
    $("#linkMenuLogout").click(logoutUser);

    $("#formLogin").submit(loginUser);
    $("#formRegister").submit(registerUser);

    $("#linkUserHomeMyMessages").click(listMyMessages);
    $("#linkUserHomeSendMessage").click(showSendMessageView);
    $("#linkUserHomeArchiveSent").click(listArchiveSent);

    $("#formSendMessage").submit(sendMessage);

    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_SkLo0OcXl";
    const kinveyAppSecret = "32e7b78bb8f549c19b01df118bbab16f";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };

    function showHideMenuLinks() {
        $("#linkMenuAppHome").show();
        if (sessionStorage.getItem('authToken')) {
            // We have logged in user
            $("#linkMenuAppHome").hide();
            $("#linkMenuLogin").hide();
            $("#linkMenuRegister").hide();

            $("#linkMenuUserHome").show();
            $("#linkMenuMyMessages").show();
            $("#linkMenuArchiveSent").show();
            $("#linkMenuSendMessage").show();
            $("#linkMenuLogout").show();
        } else {
            // No logged in user
            $("#linkMenuAppHome").show();
            $("#linkMenuLogin").show();
            $("#linkMenuRegister").show();
            $("#linkMenuUserHome").hide();
            $("#linkMenuMyMessages").hide();
            $("#linkMenuArchiveSent").hide();
            $("#linkMenuSendMessage").hide();
            $("#linkMenuLogout").hide();
        }
    }

    $("form").submit(function(e) { e.preventDefault() });

    function showView(viewName) {
        $('main > section').hide();
        $('#'+viewName).show();
    }

    function showHomeView(){
        showView('viewAppHome');
    }

    function showHomeViewUser() {
        showView('viewUserHome');
    }

    function showLoginView(){
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }

    function showRegisterView(){
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }

    function getKinveyUserAuthHeaders(){
        return {
            "Authorization" : "Kinvey "+ sessionStorage.getItem("authToken")
        }
    }

    function loginUser(){
        let userData = {
            username: $("#loginUsername").val(),
            password: $("#loginPasswd").val(),

        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });
        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showHomeViewUser();
            showInfo('Login successful.');
        }
    }

    function registerUser(event){
        event.preventDefault();

        let userData = {
            username: $("#registerUsername").val(),
            password: $("#registerPasswd").val(),
            name: $("#registerName").val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showInfo('User registration successful.');
        }
    }

    function saveAuthInSession(userInfo){
       sessionStorage.setItem("username", userInfo.username);
       sessionStorage.setItem("name", userInfo.name);
       sessionStorage.setItem("authToken", userInfo._kmd.authtoken);
       sessionStorage.setItem("userId", userInfo._id);
       $("#spanMenuLoggedInUser").text("Welcome, " + userInfo.name);
       $("#viewUserHomeHeading").text("Welcome, " + userInfo.name);
   }

    function logoutUser(){
        sessionStorage.clear();
        $("#spanMenuLoggedInUser").text('');
        showView('viewAppHome');
        showInfo("Logout Successful")
        showHideMenuLinks();
    }

    function showInfo(message){
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function handleAjaxError(response){
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function showError(errorMsg){
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function listMyMessages() {
        $('#myMessages').empty();
        showView('viewMyMessages');

            $.ajax({
                method: "GET",
                url: kinveyBaseUrl + "appdata/" + kinveyAppKey + `/messages?query={"recipient_username":"${sessionStorage.getItem('username')}"}`,
                headers: getKinveyUserAuthHeaders(),
                success: loadMessagesSuccess,
                error: handleAjaxError
            });

            function loadMessagesSuccess(messages) {

                showInfo('Messages loaded.');
                if (messages.length == 0) {
                    $('#myMessages').text('No messages.');
                }
                else {
                    let messagesTable = $('<table>')
                        .append($('<tr>').append(
                            '<th>From</th><th>Message</th>',
                            '<th>Date Received</th>'));
                    for (let msg of messages) {
                            appendMessageRow(msg, messagesTable);
                    }

                    $('#myMessages').append(messagesTable);
                }
            }

            function appendMessageRow(msg, messagesTable) {

            let deleteLink = $('<a href="#">[Delete]</a>').click(deleteMessage.bind(this, msg));

                messagesTable.append($('<tr>').append(
                $('<td>').text(msg.sender_username),
                $('<td>').text(msg.text),
                $('<td>').Date(msg._kmd.lmt),
                $('<td>').append(deleteLink)
            ));
        }
    }

    function listArchiveSent() {
        showView('viewArchiveSent');
    }

    function showSendMessageView() {
        $("#msgRecipientUsername").empty();
        showView('viewSendMessage');

        function loadRecipients(){
            $.ajax({
                method: "GET",
                url: kinveyBaseUrl + "user/" + kinveyAppKey ,
                headers: getKinveyUserAuthHeaders(),
                success: loadUsersSuccess,
                error: handleAjaxError
            });
            function loadUsersSuccess(users) {

                $('#msgRecipientUsername').append($('<option>')
                    .text(user.name)
                    .val(user.username));
                }
        }
    }

    function sendMessage(event) {
        event.preventDefault();


        let messageData = {
            recipient_username: $("#msgRecipientUsername").val(),
            sender_username: sessionStorage.getItem("username"),
            sender_name: sessionStorage.getItem("name"),
            text: $("#msgText").val(),
            date: Date.now()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/messages",
            headers: getKinveyUserAuthHeaders(),
            data: messageData,
            success: createMessageSuccess,
            error: handleAjaxError
        });

        function createMessageSuccess() {
            showInfo("Message Created.");
            listMyMessages();
        }

    }

    function deleteMessage() {
        $.ajax({
            method: "DELETE",
            url: kinveyBookUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/messages/" + message._id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteMessageSuccess,
            error: handleAjaxError
        });

        function deleteMessageSuccess(response) {
            listMyMessages();
            showInfo('Message deleted.');
        }
    }
}