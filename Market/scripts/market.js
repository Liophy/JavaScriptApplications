function startApp() {
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_B1-rK-FEx";
    const kinveyAppSecret = "088fe5ca0c9e4ed98633e120a09834a1";
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
    $("#linkMenuShop").click(listShop);
    $("#linkMenuCart").click(listCart);
    $("#linkMenuLogout").click(logoutUser);

    $("#formLogin").submit(loginUser);
    $("#formRegister").submit(registerUser);

    $("#linkUserHomeShop").click(listShop);
    $("#linkUserHomeCart").click(listCart);

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

    function listShop() {
        showView('viewShop');


       $.ajax({
           method: "GET",
           url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/products",
           headers: getKinveyUserAuthHeaders(),
           success: loadProductsSuccess,
           error: handleAjaxError
       });

       function loadProductsSuccess(products) {

           $('#shopProducts').empty();
           showInfo('Products loaded.');

           if (products.length == 0) {
               $('#shopProducts').text('No products.');
           }

           else {
               let productTable = $('<table>')
                   .append($('<tr>').append(
                       '<th>Product</th><th>Description</th>',
                       '<th>Price</th>,<th>Actions</th>'));
               for (let item of products) {
                   appendShopItemRow(item, productTable);
               }

               $('#shopProducts').append(productTable);
           }
       }

       function appendShopItemRow(item, productTable) {

           let purchaseLink = $('<a href="#">[Purchase]</a>').click(purchaseItem.bind(this, item));

           productTable.append($('<tr>').append(
               $('<td>').text(item.name),
               $('<td>').text(item.description),
               $('<td>').text(item.price),
               $('<td>').append(purchaseLink)
           ));
       }
    }

    function purchaseItem(item) {

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + `/${sessionStorage.getItem('userId')}`,
            headers: getKinveyUserAuthHeaders(),
            contentType: 'application/json',
            success: getUserItemsSuccess,
            error: handleAjaxError
        });

        function getUserItemsSuccess(object){

            if(object.cart === undefined){
                object.cart = {};
            }

            let bool = new Boolean(true)

            for( let cartItem in object.cart){

                if(item._id == cartItem) {
                    object.cart[cartItem].quantity = Number(object.cart[cartItem].quantity)+1;

                    $.ajax({
                        method: "PUT",
                        url: kinveyBaseUrl + "user/" + kinveyAppKey + `/${sessionStorage.getItem('userId')}`,
                        headers: getKinveyUserAuthHeaders(),
                        data: object,
                        success: updateCartSuccess,
                        error: handleAjaxError
                    });

                    function updateCartSuccess() {
                        showInfo("Cart updated.");
                        showView('viewCart');
                    }
                    bool = false;
                }
            }

            if(bool) {

                object.cart[item._id] = {
                    "quantity": 1,
                    "product": {
                        "name": item.name,
                        "description": item.description,
                        "price": item.price
                    }
                }

                $.ajax({
                    method: "PUT",
                    url: kinveyBaseUrl + "user/" + kinveyAppKey + `/${sessionStorage.getItem('userId')}`,
                    headers: getKinveyUserAuthHeaders(),
                    data: object,
                    success: updateCartSuccess,
                    error: handleAjaxError
                });

                function updateCartSuccess() {
                    showInfo("Cart updated.");
                    showView('viewCart');
                }
            }


            }
        }

    function listCart() {
        showView('viewCart');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + `/${sessionStorage.getItem('userId')}`,
            headers: getKinveyUserAuthHeaders(),
            contentType: 'application/json',
            success: listUserItemsSuccess,
            error: handleAjaxError
        });

        function listUserItemsSuccess(object) {

            showInfo('Products loaded.');
            $('#cartProducts').empty();
            let data = object.cart;


           let cartProductTable = $('<table>')
               .append($('<tr>').append(
                   '<th>Product</th><th>Description</th>,<th>Quantity</th>',
                   '<th>Total Price</th>,<th>Actions</th>'));
            $('#cartProducts').append(cartProductTable);

            if(object.cart != "undefined") {
                for( let cartItem in data) {
                    appendCartItemRow(cartItem, cartProductTable);
                }

                $('#cartProducts').append(cartProductTable);

                function appendCartItemRow(cartItem, cartProductTable) {

                    let discardLink = $('<a href="#">[Discard]</a>').click(discardItem.bind(this, cartItem));

                    cartProductTable.append($('<tr>').append(
                        $('<td>').text(object.cart[cartItem].product.name),
                        $('<td>').text(object.cart[cartItem].product.description),
                        $('<td>').text(object.cart[cartItem].quantity),
                        $('<td>').text(object.cart[cartItem].quantity*object.cart[cartItem].product.price),
                        $('<td>').append(discardLink)
                    ));
                }
            }
        }
    }

    function discardItem(cartItem) {

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


}