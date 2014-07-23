var MyApp = {};
MyApp.Profile = {};
MyApp.AuthorName = "";
MyApp.Messages = {};
MyApp.Friends = [];
MyApp.UrlBase = "";
MyApp.Friends = {};
MyApp.DisplayMessages = [];


document.getElementById("login").style.display = "";
document.getElementById("chat").style.display = "none";



MyApp.WriteMessages = function () {
    MyApp.DisplayMessages = [];
    
    for (var i in MyApp.Messages) {
        MyApp.Messages[i].key = i;
        MyApp.DisplayMessages.push(MyApp.Messages[i]);
    }
    MyApp.DisplayMessages.sort(function (a, b) {
        if (typeof a.timestamp === 'number' && typeof b.timestamp === 'number') {
            if (a.timestamp <= b.timestamp) { return -1; }
            else { return 1; }
        }

        else if (typeof a.timestamp !== 'number' && typeof b.timestamp === 'number') {
            return -1;
        }

        else if (typeof a.timestamp === 'number' && typeof b.timestamp !== 'number') {
            return 1;
        }

        else { return 0; }
    });
    var holder = "";
    for (var i in MyApp.DisplayMessages) {
        holder += '<tr>';
        holder += '<td>' + MyApp.DisplayMessages[i].author + '</td>';
        holder += '<td>' + MyApp.DisplayMessages[i].text + '</td>';
        holder += '<td>' + (new Date(MyApp.DisplayMessages[i].timestamp)).toUTCString() + '</td>';
        if (MyApp.DisplayMessages[i].url === MyApp.UrlBase)
        { holder += '<td><div class="red glyphicon glyphicon-remove" onclick="MyApp.DeleteMessage(\'' + MyApp.DisplayMessages[i].key + '\')"></div></td>'; }
        else (holder += '<td></td>')
        holder += '</tr>';
    }
    document.getElementById("messages").innerHTML = holder;
    $('#message-box').scrollTop($('#message-box')[0].scrollHeight);
}

MyApp.WriteMessage = function (msg) {
    var holder = "";
    holder += '<tr>';
    holder += '<td>' + msg.author + '</td>';
    holder += '<td>' + msg.text + '</td>';
    holder += '<td>' + (new Date(msg.timestamp)).toUTCString() + '</td>';
    holder += '<td>*</td>';
    holder += '</tr>';
    document.getElementById("messages").innerHTML += holder;
    $('#message-box').scrollTop($('#message-box')[0].scrollHeight);
}

MyApp.Message = function (text, author) {
    this.text = text;
    this.author = author;
}

MyApp.UrlHelper = function (base) {
    var url = "https://" + base + ".firebaseio.com";
    for (var i = 1; i < arguments.length; i++) {
        url += "/" + arguments[i]
    }
    url += '/.json';
    return url;
};

MyApp.Ajax = function (method, url, SendingData, success, error) {
    var request = new XMLHttpRequest();
    request.open(method, url);
    request.onload = function () {
        if (this.status > 199 && this.status < 400) {
            var data = JSON.parse(this.response);
            success(data);
        } else {
            console.log("Error on " + method);
            error();
        }
    };
    request.onerror = function () {
        console.log("Comm error on " + method);
        error();
    };
    if (SendingData) {
        SendingData = JSON.stringify(SendingData);
    }
    request.send(SendingData);
};
MyApp.Get = function (url, success, error) {
    MyApp.Ajax("GET", url, null, success, error);
};
MyApp.Post = function (url, data, success, error) {
    MyApp.Ajax("POST", url, data, success), error;
};
MyApp.Delete = function (url, success, error) {
    MyApp.Ajax("DELETE", url, null, success, error);
};
MyApp.Patch = function (url, data, success, error) {
    MyApp.Ajax("PATCH", url, data, success, error);
};

MyApp.PostMessage = function () {
    var text = document.getElementById("message").value;
    var msg = new MyApp.Message(text, MyApp.AuthorName);
    msg.timestamp = Date.now();
    var addMsgObject = function (data) {
        msg.key = data.name;
        msg.url = MyApp.UrlBase;
        MyApp.Messages[data.name] = msg;
        MyApp.WriteMessages();
    }
    MyApp.Post(MyApp.UrlHelper(MyApp.UrlBase, "messages"), msg, addMsgObject);
    document.getElementById("message").value = "";
};

MyApp.GetMessages = function (j) {
    if (!j) {
        MyApp.Messages = {};
        MyApp.WriteMessages();
    }
    var messages = {};
    var addToObject = function (data) {
        for (var i in MyApp.Friends[j].messages) {
            if (!data || !(i in data)) {
                delete MyApp.Messages[i];
                delete MyApp.Friends[j].messages[i];
                MyApp.WriteMessages();
            }
        }
        for (var i in data) {
            data[i].url = MyApp.Friends[j].url;
            if (!(i in MyApp.Messages)) {
                MyApp.Messages[i] = data[i];
                MyApp.WriteMessages();
                
            }
            MyApp.Friends[j].messages = data;
        }
        
    }
    MyApp.Get(MyApp.UrlHelper(MyApp.Friends[j].url, "messages"), addToObject);
}

MyApp.GetAllMessages = function () {
    var shownCount = 0;
    for (var i in MyApp.Friends) {
        if (MyApp.Friends[i].shown) {
            shownCount++;
            var messages = MyApp.GetMessages(i);
        }
    }
    if (!shownCount) {
        MyApp.Messages = {};
        MyApp.WriteMessages();
    }
    setTimeout(MyApp.GetAllMessages, 3000);
}

MyApp.DeleteMessage = function (key) {
    var removeMessage = function () {
        delete MyApp.Messages[key];
        MyApp.WriteMessages();
    }
    MyApp.Delete(MyApp.UrlHelper(MyApp.UrlBase, "messages", key), removeMessage);
}


MyApp.GetFriends = function () {
    var updateFriendList = function (data) {
        for (var i in MyApp.Friends) {
            if (!data || !(i in data)) {
                delete MyApp.Friends[i];
            }
        }
        for (var i in data) {
            if (!(i in MyApp.Friends)) {
                data[i].shown = true;
                data[i].key = i;
                MyApp.Friends[i] = data[i];
            }
        }
        MyApp.WriteFriends();
        MyApp.GetAllMessages();
    };
    MyApp.Get(MyApp.UrlHelper(MyApp.UrlBase, "friends"), updateFriendList);
};

MyApp.WriteFriends = function () {
    var holder = "";
    for (var i in MyApp.Friends) {
        holder += '<tr>';
        holder += '<td><a href="#" onclick="MyApp.ShowProfile(\'' + MyApp.Friends[i].url + '\'); return false;">' + MyApp.Friends[i].url + '</a></td>';
        if (MyApp.Friends[i].shown) {
            holder += '<td><a href="#"><div class="glyphicon glyphicon-comment" onclick="MyApp.ToggleShowFriend(\'' + i + '\');"></div></a></td>';
        } else {
            holder += '<td><a href="#"><div class="light-gray glyphicon glyphicon-comment" onclick="MyApp.ToggleShowFriend(\'' + i + '\');"></div></a></td>';
        }
        holder += '<td><a href="#"><div class="red glyphicon glyphicon-remove" onclick="MyApp.DeleteFriend(\'' + i + '\');"></div></a></td>';
        holder += '</tr>';
    }
    document.getElementById("friend-list").innerHTML = holder;
};
MyApp.AddFriend = function (url) {
    var friend = {};
    friend.shown = true;
    if (url) { friend.url = url }
    else {
        friend.url = document.getElementById("friend").value;
        document.getElementById("friend").value = "";
    };
    var updateFriendArray = function (data) {
        friend.key = data.name;
        MyApp.Friends[friend.key] = friend;
        MyApp.GetFriends();
        MyApp.WriteFriends();
    }
    MyApp.Post(MyApp.UrlHelper(MyApp.UrlBase, "friends"), friend, updateFriendArray);
};
MyApp.ToggleShowFriend = function (key) {
    MyApp.Messages = {};
    MyApp.Friends[key].shown = !MyApp.Friends[key].shown;
    MyApp.WriteFriends();
};
MyApp.DeleteFriend = function (key) {
    var deleteFriend = function () {
        MyApp.Messages = {};
        MyApp.GetFriends();
        MyApp.WriteFriends();
    }
    MyApp.Delete(MyApp.UrlHelper(MyApp.UrlBase, "friends", key), deleteFriend);
}

MyApp.ShowProfile = function (base) {
    $("#profile-modal").modal('show');
    var showProfile = function (profile) {
        for (var i in profile) {
            document.getElementById("modal-title").innerHTML = profile[i].name;
            document.getElementById("profile-image").setAttribute("src", profile[i].image);
            document.getElementById("profile-bio").innerHTML = profile[i].bio;
        }
    };
    var showFriends = function (friends) {
        console.log(friends);
        var holder = "";
        for (var i in friends) {
          
            holder += '<ul>';
            holder += '<li><a href="#" onclick="MyApp.ShowProfile(\'' + friends[i].url + '\'); return false;">' + friends[i].url + '</a></td>';
            holder += '<a href="#"><div class="green glyphicon glyphicon-plus" onclick="MyApp.AddFriend(\'' + friends[i].url + '\');"></div></a>';
            holder += '</ul>';
            
        }
        document.getElementById("friends-friends").innerHTML = holder;

    };
    MyApp.Get(MyApp.UrlHelper(base, "profile"), showProfile);
    MyApp.Get(MyApp.UrlHelper(base, "friends"), showFriends);

};

MyApp.ShowEditProfile = function () {
    $("#profile-modal").modal('hide');
    $("#edit-profile-modal").modal('show');
}

MyApp.SaveProfile = function () {
    var closeEditProfile = function () {
        $("#edit-profile-modal").modal('hide');
    }
    var replace = function () {
        var profile = {};
        profile.name = document.getElementById("edit-profile-name").value;
        profile.image = document.getElementById("edit-profile-image").value;
        profile.bio = document.getElementById("edit-profile-bio").value;
        MyApp.Post(MyApp.UrlHelper(MyApp.UrlBase, "profile"), profile, closeEditProfile);
    }
    
    MyApp.Delete(MyApp.UrlHelper(MyApp.UrlBase, "profile"), replace);
    
}
MyApp.Login = function () {
    MyApp.UrlBase = document.getElementById("url").value;
    MyApp.AuthorName = document.getElementById("name").value;
    

    var login = function () {
        document.getElementById("login").style.display = "none";
        document.getElementById("chat").style.display = "";
        MyApp.GetFriends();
    };
    var showError = function () {
        var urlInput = document.getElementById("url");
        urlInput.focus();
        urlInput.select();
        MyApp.UrlBase = document.getElementById("url").value;
        document.getElementById("alert").innerHTML =
        '<div id="error-alert" class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Couldn\'t connect to Firebase account.</div>';
        $("#error-alert").fadeTo(2000, 500).slideUp(500, function () {
            $("#error-alert").alert('close');
        });
    };
    MyApp.Get(MyApp.UrlHelper(MyApp.UrlBase, "profile"), login, showError);
};

$("#url").keyup(function (event) {
    if (event.keyCode == 13) {
        $("#login-button").click();
    }
});
