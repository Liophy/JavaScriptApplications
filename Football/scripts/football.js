function startApp() {
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_ByqWfGbBe";
    const kinveyAppSecret = "1d9bf49947f14c95a06f127fcb3e150b";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };

    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewAppHome');

    $("#linkMenuAppHome").click(showHomeView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);

    $("#linkMenuUserHome").click(showHomeViewUser);

    $("#linkMenuAllMatches").click(listAllMatches);
    $("#linkMenuAllPlayers").click(listAllPlayers);
    $("#linkMenuLogout").click(logoutUser);

    $("#formLogin").submit(loginUser);
    $("#formRegister").submit(registerUser);
    $("#formAddNewPlayer").submit(addNewPlayer);
    $("#formAddNewMatch").submit(addNewMatch);

    $("#linkUserHomeAddMatch").click(addNewMatchView);
    $("#linkUserHomeAddPlayer").click(addNewPlayerView);

    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });

    function showHideMenuLinks() {
        $("#linkMenuAppHome").show();
        if (sessionStorage.getItem('authToken')) {
            // We have logged in user
            $("#linkMenuAppHome").hide();
            $("#linkMenuLogin").hide();
            $("#linkMenuRegister").hide();
            $("#linkMenuUserHome").show();
            $("#linkMenuShop").show();
            $("#linkMenuCart").show();
            $("#linkMenuLogout").show();
        } else {
            // No logged in user
            $("#linkMenuAppHome").show();
            $("#linkMenuLogin").show();
            $("#linkMenuRegister").show();
            $("#linkMenuUserHome").hide();
            $("#linkMenuShop").hide();
            $("#linkMenuCart").hide();
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
            name: $("#registerName").val(),
            playerstats: {
                points: Number(0),
                rank: Number(1000)
            }
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
            showHomeViewUser();
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
        return  $.ajax({
            method: 'POST',
            url: kinveyBaseUrl +"user/" + kinveyAppKey + "/_logout",
            headers: getKinveyUserAuthHeaders(),
            success: successLogout(),
            error: handleAjaxError
        });

        function successLogout() {
            sessionStorage.clear();
            $("#spanMenuLoggedInUser").text('');
            showView('viewAppHome');
            showInfo("Logout Successful")
            showHideMenuLinks();
        }
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

    function listAllMatches() {
        showView('viewAllMatches');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/matches",
            headers: getKinveyUserAuthHeaders(),
            success: loadMatchesSuccess,
            error: handleAjaxError
        });

        function loadMatchesSuccess(matches) {

            $('#listAllMatches').empty();
            showInfo('Matches loaded.');

            if (matches.length == 0) {
                $('#listAllMatches').text('Няма мачове.');
            }

            else {
                let matchTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>N</th>'+
                        '<th>Отбор 1</th>'+
                        '<th></th>'+
                        '<th></th>'+
                        '<th>Отбор 2</th>'+
                        '<th>Дата</th>'
                    ));
                let count = 1;
                for (let match of matches) {
                    appendMatchRow(match, matchTable);
                }

                $('#listAllMatches').append(matchTable);

                function appendMatchRow(match, matchTable) {

                    let matchLink = $('<a href="#">[Edit]</a>').click(editMatch.bind(this, match));

                    matchTable.append($('<tr>').append(
                        $('<td>').text(count),
                        $('<td>').text(match.team1.name),
                        $('<td>').text(match.team1.result),
                        $('<td>').text(match.team2.result),
                        $('<td>').text(match.team2.name),
                        $('<td>').text(match.date),
                        $('<td>').append(matchLink)
                    ));
                    count++
                }
            }
        }


    }

    function listAllPlayers() {
        showView('viewAllPlayers');
        calculateRank();

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey,
            headers: getKinveyUserAuthHeaders(),
            success: loadUsersSuccess,
            error: handleAjaxError
        });

        function loadUsersSuccess(players) {

            showInfo('Players loaded');
            $('#viewAllPlayers').empty();

            let playersTable = $('<table>')
                .append($('<tr>').append(
                    '<th>N</th>'+
                    '<th>Име</th>'+
                    '<th>Ранг</th>'+
                    '<th>Мачове</th>'+
                    '<th>Победи</th>'+
                    '<th>Равни</th>'+
                    '<th>Загуби</th>'
                    ));
            $('#viewAllPlayers').append(playersTable);
            let count = 1;


                for( let player of players) {
                    appendPlayerRow(player, playersTable);
                    count++;
                }

                function appendPlayerRow(player, playersTable) {


                    let editLink = $('<a href="#">[Edit]</a>').click(editPlayer.bind(this, player));

                    playersTable.append($('<tr>').append(
                        $('<td>').text(count),
                        $('<td>').text(player.username),
                        $('<td>').text(player.playerstats.rank),
                        $('<td>').text(""),
                        $('<td>').text(""),
                        $('<td>').text(""),
                        $('<td>').text(""),
                        $('<td>').append(editLink)
                    ));
                }
        }
    }

    function editPlayer(player) {
        //cartItem== player

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + `/${sessionStorage.getItem('userId')}`,
            headers: getKinveyUserAuthHeaders(),
            contentType: 'application/json',
            success: getUserItemsSuccess,
            error: handleAjaxError
        });

        function getUserItemsSuccess(object){

            for( let item in object.cart) {

                if(cartItem==item){
                    delete object.cart[cartItem]

                    $.ajax({
                        method: "PUT",
                        url: kinveyBaseUrl + "user/" + kinveyAppKey + `/${sessionStorage.getItem('userId')}`,
                        headers: getKinveyUserAuthHeaders(),
                        data: object,
                        success: updateCartSuccess,
                        error: handleAjaxError
                    });

                    function updateCartSuccess() {
                        showInfo("Item discarded");
                        showView('viewCart');
                    }
                }
            }

        }

    }

    function editMatch(match) {

    }

    function addNewMatchView() {
        $('#formAddNewMatch').trigger('reset');
        showView('viewAddMatch');
        loadPlayersInSelect();
        autocomplete();
    }

    function addNewMatch() {

        let match = {
            "date": $("#matchDate").val(),
            "team1": {
                "name": $("#teamOneName").val(),
                "result": $("#teamOneResult").val(),
                "player1": {
                    "_id": $("#teamOnePlayerOne").find(":selected").data("value")._id,
                    "username": $("#teamOnePlayerOne").find(":selected").data("value").username,
                    "playerstats": $("#teamOnePlayerOne").find(":selected").data("value").playerstats
                },
                "player2": {
                    "_id": $("#teamOnePlayerTwo").find(":selected").data("value")._id,
                    "username": $("#teamOnePlayerTwo").find(":selected").data("value").username,
                    "playerstats": $("#teamOnePlayerTwo").find(":selected").data("value").playerstats
                },
                "player3": {
                    "_id": $("#teamOnePlayerThree").find(":selected").data("value")._id,
                    "username": $("#teamOnePlayerThree").find(":selected").data("value").username,
                    "playerstats": $("#teamOnePlayerThree").find(":selected").data("value").playerstats
                },
                "player4": {
                    "_id": $("#teamOnePlayerFour").find(":selected").data("value")._id,
                    "username": $("#teamOnePlayerFour").find(":selected").data("value").username,
                    "playerstats": $("#teamOnePlayerFour").find(":selected").data("value").playerstats
                },
                "player5": {
                    "_id": $("#teamOnePlayerFive").find(":selected").data("value")._id,
                    "username": $("#teamOnePlayerFive").find(":selected").data("value").username,
                    "playerstats": $("#teamOnePlayerFive").find(":selected").data("value").playerstats
                },
                "player6": {
                    "_id": $("#teamOnePlayerSix").find(":selected").data("value")._id,
                    "username": $("#teamOnePlayerSix").find(":selected").data("value").username,
                    "playerstats": $("#teamOnePlayerSix").find(":selected").data("value").playerstats
                }
            },
            "team2": {
                "name": $("#teamTwoName").val(),
                "result": $("#teamTwoResult").val(),
                "player1": {
                    "_id": $("#teamTwoPlayerOne").find(":selected").data("value")._id,
                    "username": $("#teamTwoPlayerOne").find(":selected").data("value").username,
                    "playerstats": $("#teamTwoPlayerOne").find(":selected").data("value").playerstats
                },
                "player2": {
                    "_id": $("#teamTwoPlayerTwo").find(":selected").data("value")._id,
                    "username": $("#teamTwoPlayerTwo").find(":selected").data("value").username,
                    "playerstats": $("#teamTwoPlayerTwo").find(":selected").data("value").playerstats
                },
                "player3": {
                    "_id": $("#teamTwoPlayerThree").find(":selected").data("value")._id,
                    "username": $("#teamTwoPlayerThree").find(":selected").data("value").username,
                    "playerstats": $("#teamTwoPlayerThree").find(":selected").data("value").playerstats
                },
                "player4": {
                    "_id": $("#teamTwoPlayerFour").find(":selected").data("value")._id,
                    "username": $("#teamTwoPlayerFour").find(":selected").data("value").username,
                    "playerstats": $("#teamTwoPlayerFour").find(":selected").data("value").playerstats
                },
                "player5": {
                    "_id": $("#teamTwoPlayerFive").find(":selected").data("value")._id,
                    "username": $("#teamTwoPlayerFive").find(":selected").data("value").username,
                    "playerstats": $("#teamTwoPlayerFive").find(":selected").data("value").playerstats
                },
                "player6": {
                    "_id": $("#teamTwoPlayerSix").find(":selected").data("value")._id,
                    "username": $("#teamTwoPlayerSix").find(":selected").data("value").username,
                    "playerstats": $("#teamTwoPlayerSix").find(":selected").data("value").playerstats
                }
            }
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/matches",
            headers: getKinveyUserAuthHeaders(),
            data: match,
            success: addMatchSuccess,
            error: handleAjaxError
        });


        function addMatchSuccess(response) {
            calculateMatch(response);
            showHomeViewUser();
            showInfo('Мачът е добавен успешно.');
        }

    }

    function addNewPlayerView(){

        $('#formAddNewPlayer').trigger('reset');
        showView('viewAddPlayer');
    }

    function addNewPlayer(){

        let userData = {
            username: $("#addNewPlayerUsername").val(),
            playerstats: {
                points: Number(1),
                rank: Number(1000)
            },
            _acl:             {
                "creator": "user_id_1",
                "gr": true,
                "gw": false,
                "r": ["5874dc61ef097e580fd27fce"],
                "w": ["5874dc61ef097e580fd27fce"],
                "groups": {
                    "r": ["group_id_1", "group_id_5"],
                    "w": ["group_id_3", "group_id_4"]
                }
            }
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
        function registerSuccess() {
            $('#formAddNewPlayer').trigger('reset');
            showView('viewAddPlayer');
            showInfo('Успешна регистрация.');
        }
    }

    function loadPlayersInSelect(){


        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey,
            headers: getKinveyUserAuthHeaders(),
            success: loadUsersSuccess,
            error: handleAjaxError
        });

        function loadUsersSuccess(users){
            for (let user of users) {

                $( "#teamOnePlayerOne, #teamOnePlayerTwo, #teamOnePlayerThree, #teamOnePlayerFour, #teamOnePlayerFive, #teamOnePlayerSix, " +
                    "#teamTwoPlayerOne, #teamTwoPlayerTwo, #teamTwoPlayerThree, #teamTwoPlayerFour, #teamTwoPlayerFive, #teamTwoPlayerSix" ).append(
                    $('<option>')
                        .text(user.username)
                        .val(user._id)
                        .data("value", user)
                );
            }
        }
    }

    function calculateMatch(match){

        let playersForUpdateTeam1 = [];
        let playersForUpdateTeam2 = [];

        playersForUpdateTeam1.push(match.team1.player1);
        playersForUpdateTeam1.push(match.team1.player2);
        playersForUpdateTeam1.push(match.team1.player3);
        playersForUpdateTeam1.push(match.team1.player4);
        playersForUpdateTeam1.push(match.team1.player5);
        playersForUpdateTeam1.push(match.team1.player6);

        playersForUpdateTeam2.push(match.team2.player1);
        playersForUpdateTeam2.push(match.team2.player2);
        playersForUpdateTeam2.push(match.team2.player3);
        playersForUpdateTeam2.push(match.team2.player4);
        playersForUpdateTeam2.push(match.team2.player5);
        playersForUpdateTeam2.push(match.team2.player6);

        function updatePlayer(){
            for(let i = 0; i<6; i++){
                playersForUpdateTeam1[i].playerstats.rank = Number(playersForUpdateTeam1[i].playerstats.rank) + Number(pointsTeamOne);
                $.ajax({
                    method: "PUT",
                    url: kinveyBaseUrl + "user/" + kinveyAppKey +"/"+ playersForUpdateTeam1[i]._id,
                    headers: getKinveyUserAuthHeaders(),
                    data: playersForUpdateTeam1[i],
                    success: console.log("success"),
                    error: handleAjaxError
                });
            }
            for(let i = 0; i<6; i++){
                playersForUpdateTeam2[i].playerstats.rank = Number(playersForUpdateTeam2[i].playerstats.rank) + Number(pointsTeamTwo);
                $.ajax({
                    method: "PUT",
                    url: kinveyBaseUrl + "user/" + kinveyAppKey +"/"+ playersForUpdateTeam2[i]._id,
                    headers: getKinveyUserAuthHeaders(),
                    data: playersForUpdateTeam2[i],
                    success: console.log("success"),
                    error: handleAjaxError
                });
            }
        }

        let team1rank = Number(match.team1.player1.playerstats.rank)+
            Number(match.team1.player2.playerstats.rank)+
            Number(match.team1.player3.playerstats.rank)+
            Number(match.team1.player4.playerstats.rank)+
            Number(match.team1.player5.playerstats.rank)+
            Number(match.team1.player6.playerstats.rank);

        let team2rank = Number(match.team2.player1.playerstats.rank)+
            Number(match.team2.player2.playerstats.rank)+
            Number(match.team2.player3.playerstats.rank)+
            Number(match.team2.player4.playerstats.rank)+
            Number(match.team2.player5.playerstats.rank)+
            Number(match.team2.player6.playerstats.rank);

        let handicap = Math.round((Math.abs(team1rank - team2rank)/50));

        let goalDifference = Math.abs(match.team1.result - match.team2.result);
        let pointsTeamOne = 0;
        let pointsTeamTwo = 0;


        if(team1rank > team2rank) {
            if(match.team1.result > (match.team2.result + handicap)){

                pointsTeamOne = 10 + goalDifference - handicap;
                pointsTeamTwo = - 10 - goalDifference + handicap;
                updatePlayer();
            }
            else if((match.team1.result + handicap) < match.team2.result){

                pointsTeamOne = - 10 - goalDifference - handicap;
                pointsTeamTwo = 10 + goalDifference + handicap;
                updatePlayer();
            }
        }
        else if(team1rank < team2rank) {
            if((match.team1.result + handicap) > match.team2.result){

                pointsTeamOne = 10 + goalDifference + handicap;
                pointsTeamTwo = - 10 - goalDifference - handicap;
                updatePlayer();
            }
            else if((match.team1.result + handicap) < match.team2.result){

                pointsTeamOne = - 10 - goalDifference + handicap;
                pointsTeamTwo = 10 + goalDifference - handicap;
                updatePlayer();
            }
        }
        else if(team1rank == team2rank) {
            if(match.team1.result > match.team2.result){

                pointsTeamOne = 10 + goalDifference;
                pointsTeamTwo = - 10 - goalDifference;
                updatePlayer();
            }
            else if(match.team1.result < match.team2.result){

                pointsTeamOne = - 10 - goalDifference;
                pointsTeamTwo = 10 + goalDifference;
                updatePlayer();
            }

        }
    }

    function calculateRank(){

    }

    function autocomplete() {

       $( function() {
           $.widget( "custom.combobox", {
               _create: function() {
                   this.wrapper = $( "<span>" )
                       .addClass( "custom-combobox" )
                       .insertAfter( this.element );

                   this.element.hide();
                   this._createAutocomplete();
                   this._createShowAllButton();
               },

               _createAutocomplete: function() {
                   var selected = this.element.children( ":selected" ),
                       value = selected.val() ? selected.text() : "";

                   this.input = $( "<input>" )
                       .appendTo( this.wrapper )
                       .val( value )
                       .attr( "title", "" )
                       .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
                       .autocomplete({
                           delay: 0,
                           minLength: 0,
                           source: $.proxy( this, "_source" )
                       })
                       .tooltip({
                           classes: {
                               "ui-tooltip": "ui-state-highlight"
                           }
                       });

                   this._on( this.input, {
                       autocompleteselect: function( event, ui ) {
                           ui.item.option.selected = true;
                           this._trigger( "select", event, {
                               item: ui.item.option
                           });
                       },

                       autocompletechange: "_removeIfInvalid"
                   });
               },

               _createShowAllButton: function() {
                   var input = this.input,
                       wasOpen = false;

                   $( "<a>" )
                       .attr( "tabIndex", -1 )
                       .attr( "title", "Show All Items" )
                       .tooltip()
                       .appendTo( this.wrapper )
                       .button({
                           icons: {
                               primary: "ui-icon-triangle-1-s"
                           },
                           text: false
                       })
                       .removeClass( "ui-corner-all" )
                       .addClass( "custom-combobox-toggle ui-corner-right" )
                       .on( "mousedown", function() {
                           wasOpen = input.autocomplete( "widget" ).is( ":visible" );
                       })
                       .on( "click", function() {
                           input.trigger( "focus" );

                           // Close if already visible
                           if ( wasOpen ) {
                               return;
                           }

                           // Pass empty string as value to search for, displaying all results
                           input.autocomplete( "search", "" );
                       });
               },

               _source: function( request, response ) {
                   var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
                   response( this.element.children( "option" ).map(function() {
                       var text = $( this ).text();
                       if ( this.value && ( !request.term || matcher.test(text) ) )
                           return {
                               label: text,
                               value: text,
                               option: this
                           };
                   }) );
               },

               _removeIfInvalid: function( event, ui ) {

                   // Selected an item, nothing to do
                   if ( ui.item ) {
                       return;
                   }

                   // Search for a match (case-insensitive)
                   var value = this.input.val(),
                       valueLowerCase = value.toLowerCase(),
                       valid = false;
                   this.element.children( "option" ).each(function() {
                       if ( $( this ).text().toLowerCase() === valueLowerCase ) {
                           this.selected = valid = true;
                           return false;
                       }
                   });

                   // Found a match, nothing to do
                   if ( valid ) {
                       return;
                   }

                   // Remove invalid value
                   this.input
                       .val( "" )
                       .attr( "title", value + " didn't match any item" )
                       .tooltip( "open" );
                   this.element.val( "" );
                   this._delay(function() {
                       this.input.tooltip( "close" ).attr( "title", "" );
                   }, 2500 );
                   this.input.autocomplete( "instance" ).term = "";
               },

               _destroy: function() {
                   this.wrapper.remove();
                   this.element.show();
               }
           });

           $( "#teamOnePlayerOne, #teamOnePlayerTwo, #teamOnePlayerThree, #teamOnePlayerFour, #teamOnePlayerFive, #teamOnePlayerSix, " +
               "#teamTwoPlayerOne, #teamTwoPlayerTwo, #teamTwoPlayerThree, #teamTwoPlayerFour, #teamTwoPlayerFive, #teamTwoPlayerSix" ).combobox();

       } );
    }

    function jQueryAutocomplete(){

        $( function() {
            var availableTags = [
                "ActionScript",
                "AppleScript",
                "Asp",
                "BASIC",
                "C",
                "C++",
                "Clojure",
                "COBOL",
                "ColdFusion",
                "Erlang",
                "Fortran",
                "Groovy",
                "Haskell",
                "Java",
                "JavaScript",
                "Lisp",
                "Perl",
                "PHP",
                "Python",
                "Ruby",
                "Scala",
                "Scheme"
            ];
            $( "#teamOnePlayerOne, #teamOnePlayerTwo, #teamOnePlayerThree, #teamOnePlayerFour, #teamOnePlayerFive, #teamOnePlayerSix, " +
                "#teamTwoPlayerOne, #teamTwoPlayerTwo, #teamTwoPlayerThree, #teamTwoPlayerFour, #teamTwoPlayerFive, #teamTwoPlayerSix" ).autocomplete({
                source: loadPlayersInSelect()
            });
        } );
    }

}