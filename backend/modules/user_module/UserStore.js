const User = require("./../../models/User");
const mongoose = require("mongoose");
const ERROR_CODES = require("./../../ErrorCodes.js")
const ResponseObject = require("./../../ResponseObject")

class UserStore {
    // async findUserByEvent(eventID) {
    //     return await User.find({
    //         events: { $in: [eventID] },
    //     });
    // }

    async findUserByID(userID) {
        if (!mongoose.isObjectIdOrHexString(userID)) {
            return new ResponseObject(ERROR_CODES.INVALID)
        };
        console.log(userID);
        let foundUser = await User.findById(userID);
        if(foundUser) return new ResponseObject(ERROR_CODES.SUCCESS, foundUser)
        else return new ResponseObject(ERROR_CODES.NOTFOUND)
    }

    async findAllUsers() {
        let userList = await User.find({});
        if(userList.length !== 0) return new ResponseObject(ERROR_CODES.SUCCESS, userList)
        else return new ResponseObject(ERROR_CODES.NOTFOUND, userList)
    }

    async updateUserAccount(userID, userInfo) {
        if (!mongoose.isObjectIdOrHexString(userID)) {
            return new ResponseObject(ERROR_CODES.INVALID)
        };
        console.log("IN UPDATE USER ACCOUNT")
        console.log(userID)
        console.log(userInfo)
        let foundUser = await User.findByIdAndUpdate(userID, userInfo, {new: true})
        if(foundUser) return new ResponseObject(ERROR_CODES.SUCCESS, foundUser)
        else return new ResponseObject(ERROR_CODES.NOTFOUND)
    }

    async createUser(userInfo) {
        let newUser = await new User(userInfo).save();
        return new ResponseObject(ERROR_CODES.SUCCESS, newUser)
    }

    async findFriendByIDList(friendIDList) {
        if(!friendIDList.every((id) => mongoose.isObjectIdOrHexString(id)))
            return new ResponseObject(ERROR_CODES.INVALID, [])
        let friendList = await User.find({
            _id: {
                $in: friendIDList,
            },
        });
        if(friendList.length !== 0) return new ResponseObject(ERROR_CODES.SUCCESS, friendList)
        else return new ResponseObject(ERROR_CODES.NOTFOUND, friendList)
    }

    async findChatInvites(chatReqList, chatEngine) {
        if(!chatReqList.every((id) => mongoose.isObjectIdOrHexString(id)))
            return new ResponseObject(ERROR_CODES.INVALID, [])
        let response = await chatEngine.findChatByIDList(chatReqList);
        return new ResponseObject(ERROR_CODES.SUCCESS, response)
    }

    async acceptChatInvite(userID, chatID, chatEngine) {
        if (
            !mongoose.isObjectIdOrHexString(userID) ||
            !mongoose.isObjectIdOrHexString(chatID)
        ) {
            return { status: ERROR_CODES.INVALID, data: null };
        }
        let chat = await chatEngine.findChatByID(chatID);
        let user = await this.findUserByID(userID);
        if (chat.data && user.data) {
            if (
                chat.data.currCapacity < chat.data.numberOfPeople &&
                !user.data.chats.includes(chatID) &&
                !chat.data.participants.includes(userID)
            ) {
                await User.findByIdAndUpdate(userID, {
                    $push: { chat: chatID },
                    $pull: { chatInvites: chatID },
                });
                await chatEngine.editChat(
                    chatID,
                    {
                        $push: { participants: userID },
                        $inc: { currCapacity: 1 },
                    },
                    this
                );
                return {status: ERROR_CODES.SUCCESS, data: null};
            } else {
                return {status: ERROR_CODES.CONFLICT, data: null};
            }
        } else {
            return {status: ERROR_CODES.NOTFOUND, data: null};
        }
    }

    async rejectChatInvite(userID, chatID) {
        if (
            !mongoose.isObjectIdOrHexString(userID) ||
            !mongoose.isObjectIdOrHexString(chatID)
        ) {
            return { status: ERROR_CODES.INVALID, data: null };
        }
        let user = await this.findUserByID(userID);
        if(user.data){
            if(user.data.chatInvites.includes(chatID)){
                await User.findByIdAndUpdate(userID, {
                    $pull: { chatInvites: chatID },
                });
                return {status: ERROR_CODES.SUCCESS, data: null};
            } else {
                return {status: ERROR_CODES.CONFLICT, data: null};
            }
        } else {
            return {status: ERROR_CODES.NOTFOUND, data: null};
        }
    }

    async acceptEventInvite(userID, eventID, eventStore, chatEngine) {
        if (
            !mongoose.isObjectIdOrHexString(userID) ||
            !mongoose.isObjectIdOrHexString(chatID) ||
            !mongoose.isObjectIdOrHexString(eventID)
        ) {
            return { status: ERROR_CODES.INVALID, data: null };
        }
        let event = await eventStore.findEventByID(eventID);
        let user = await this.findUserByID(userID);
        let chat = await chatEngine.findChatByID(event.chat);
        if (event.data && user.data && chat.data) {
            if (
                event.data.currCapacity < event.data.numberOfPeople &&
                !user.data.chats.includes(eventID) &&
                !event.data.participants.includes(userID)
            ) {
                await User.findByIdAndUpdate(userID, {
                    $push: { events: eventID },
                    $pull: { eventInvites: eventID },
                });

                await eventStore.updateEvent(
                    eventID,
                    {
                        $push: { participants: userID },
                        $inc: { currCapacity: 1 },
                    },
                    this
                );
                return await this.acceptChatInvite(
                    userID,
                    chat._id,
                    chatEngine
                );
            } else {
                return {status: ERROR_CODES.INVALID, data: null};
            }
        } else {
            return {status: ERROR_CODES.NOTFOUND, data: null};
        }
    }

    async rejectEventInvite(userID, eventID) {
        await User.findByIdAndUpdate(userID, {
            $pull: { eventInvites: eventID },
        });
    }

    async sendFriendRequest(userID, otherUserID) {
        console.log("IN THE SEND FRIEND REQUEST FUNCTION");
        let user = await this.findUserByID(userID);
        let otherUser = await this.findUserByID(otherUserID);
        if (user && otherUser) {
            if (
                !user.friends.includes(otherUserID) &&
                !otherUser.friends.includes(userID) &&
                !otherUser.friendRequest.includes(userID)
            ) {
                await User.findByIdAndUpdate(otherUserID, {
                    $push: { friendRequest: userID },
                });
                return ERROR_CODES.SUCCESS;
            } else {
                return ERROR_CODES.CONFLICT;
            }
        } else {
            return ERROR_CODES.NOTFOUND;
        }
    }

    async rejectFriendRequest(userID, otherUserID) {
        await User.findByIdAndUpdate(userID, {
            $pull: { friendRequest: otherUserID },
        });
    }

    async sendChatInvite(userID, chatID, chatEngine) {
        let user = await this.findUserByID(userID);
        let chat = await chatEngine.findChatByID(chatID);
        if (user && chat) {
            if (
                !user.chats.includes(chatID) &&
                !chat.participants.includes(userID) &&
                !user.chatInvites.includes(chatID)
            ) {
                await User.findByIdAndUpdate(userID, {
                    $push: { chatInvites: chatID },
                });
                return ERROR_CODES.SUCCESS;
            } else {
                return ERROR_CODES.CONFLICT;
            }
        } else {
            return ERROR_CODES.NOTFOUND;
        }
    }

    async acceptFriendRequest(userID, otherUserID) {
        let user = await this.findUserByID(userID);
        let otherUser = await this.findUserByID(otherUserID);
        if (user && otherUser) {
            if (
                !user.friends.includes(otherUserID) &&
                !otherUser.friends.includes(userID)
            ) {
                await User.findByIdAndUpdate(userID, {
                    $push: { friends: otherUserID },
                    $pull: { friendRequest: otherUserID },
                });
                await User.findByIdAndUpdate(otherUserID, {
                    $push: { friends: userID },
                });
                return ERROR_CODES.SUCCESS;
            } else {
                return ERROR_CODES.CONFLICT;
            }
        } else {
            return ERROR_CODES.NOTFOUND;
        }
    }

    async findUnblockedUsers(userID) {
        let user = await this.findUserByID(userID);
        if (user) {
            return await User.find({
                _id: { $nin: user.blockedUsers },
            });
        }
        return null;
    }

    async addChat(chatID, chatInfo) {
        await User.updateMany(
            {
                $and: [
                    { _id: { $in: chatInfo.participants } },
                    { chats: { $ne: chatID } },
                ],
            },
            { $push: { chats: chatID } }
        );
    }

    async findUserByName(userName) {
        let capName = titleCase(userName);
        console.log(capName);
        let foundUserList = await User.find({
            name: { $regex: capName, $options: "i" },
        });
        if(foundUserList.length !== 0) return new ResponseObject(ERROR_CODES.SUCCESS, foundUserList)
        else return new ResponseObject(ERROR_CODES.NOTFOUND, foundUserList)
    }

    async removeChat(chatID, chatInfo) {
        await User.updateMany(
            {
                $and: [
                    { _id: { $nin: chatInfo.participants } },
                    { chats: chatID },
                ],
            },
            { $pull: { chats: chatID } }
        );
    }

    async addEvent(eventID, eventInfo) {
        await User.updateMany(
            {
                $and: [
                    { _id: { $in: eventInfo.participants } },
                    { events: { $ne: eventID } },
                ],
            },
            { $push: { events: eventID } }
        );
    }

    async removeEvent(eventID, eventInfo) {
        await User.updateMany(
            {
                $and: [
                    { _id: { $nin: eventInfo.participants } },
                    { events: eventID },
                ],
            },
            { $pull: { events: eventID } }
        );
    }

    //! Need to do
    async deleteUser(userID) {
        return await User.findByIdAndDelete(userID);
    }

    async removeFriend(userID, otherUserID) {
        if (
            !mongoose.isObjectIdOrHexString(userID) ||
            !mongoose.isObjectIdOrHexString(otherUserID)
        ) {
            return new ResponseObject(ERROR_CODES.INVALID);
        }
        let userResponse = await this.findUserByID(userID)
        let otherUserResponse = await this.findUserByID(otherUserID)
        if (userResponse.data && otherUserResponse.data) {
            await User.updateMany(
                { _id: { $in: [userID, otherUserID] } },
                { $pull: { friends: { $in: [userID, otherUserID] } } }
            )
            return new ResponseObject(ERROR_CODES.SUCCESS)
        } else {
            return new ResponseObject(ERROR_CODES.NOTFOUND)
        }
    }

    async leaveEvent(userID, eventID, eventStore) {
        if (
            !mongoose.isObjectIdOrHexString(userID) ||
            !mongoose.isObjectIdOrHexString(eventID)
        ) {
            return new ResponseObject(ERROR_CODES.INVALID);
        }
        let user = await User.findByIdAndUpdate(userID, {
            $pull: { $events: eventID },
        });
        if(user) {
            let response = await eventStore.removeUser(userID, eventID, this);
            return response
        } else {
            return new ResponseObject(ERROR_CODES.NOTFOUND)
        }
    }

    async leaveChat(userID, chatID, chatEngine) {
        if (
            !mongoose.isObjectIdOrHexString(userID) ||
            !mongoose.isObjectIdOrHexString(chatID)
        ) {
            return new ResponseObject(ERROR_CODES.INVALID)
        }
        let user = await User.findByIdAndUpdate(userID, {
            $pull: { $chat: chatID },
        });
        if(user) {
            let response = await chatEngine.removeUser(chatID, userID, this);
            return response
        } else {
            return new ResponseObject(ERROR_CODES.NOTFOUND)
        }
    }

    async findUserForLogin(Token) {
        let user = await User.findOne({
            token: Token,
        });
        if(user) return new ResponseObject(ERROR_CODES.SUCCESS, user)
        else return new ResponseObject(ERROR_CODES.NOTFOUND)
    }
}

function titleCase(str) {
    var splitStr = str.toLowerCase().split(" ");
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] =
            splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(" ");
}

module.exports = UserStore;