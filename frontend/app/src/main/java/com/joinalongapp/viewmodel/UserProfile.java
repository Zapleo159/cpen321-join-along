package com.joinalongapp.viewmodel;

import android.graphics.Bitmap;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserProfile implements Serializable, IDetailsModel {
    private UUID id;
    private String firstName;
    private String lastName;
    private String location;
    private List<Tag> tags = new ArrayList<>(); //TODO: it might be good to make this have its own datatype, or maybe a list of ENUM's
    private String description;
    private Bitmap profilePicture;
    private List<UserProfile> friends = new ArrayList<>();


    public void setId(UUID id) {
        this.id = id;
    }

    public List<Tag> getTags() {
        return tags;
    }

    public void setTags(List<Tag> tags) {
        this.tags.addAll(tags);
    }

    public void setFriends(List<UserProfile> friends) {
        this.friends.addAll(friends);
    }

    public UserProfile(UUID id, String firstName, String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public UserProfile() {
    }

    public UUID getId() {
        return id;
    }

    public List<UserProfile> getFriends() {
        return friends;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public List<Tag> getInterests() {
        return tags;
    }

    public void setInterests(List<Tag> interests) {
        this.tags = interests;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Bitmap getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(Bitmap profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getFullName(){
        return firstName + " " + lastName;
    }

    public String[] getFriendsStringArray(){
        String[] result = new String[friends.size()];
        for(int i = 0; i < friends.size(); i++){
            result[i] = friends.get(i).getFullName();
        }
        return result;
    }

    public String toJsonString() throws JSONException {
        List<String> friendId = new ArrayList<>();
        for(UserProfile friend : friends){
            friendId.add(friend.getId().toString());
        }
        JSONObject json = new JSONObject();
        json.put("id", getId());
        json.put("firstName", getFirstName());
        json.put("lastName", getLastName());
        json.put("location", getLocation());
        json.put("interests", getStringListOfTags());
        json.put("description", getDescription());
        json.put("profilePicture", getProfilePicture());
        json.put("friends", friendId);

        return json.toString();
    }

    public List<String> getStringListOfTags(){
        List<String> result = new ArrayList<>();
        for(Tag tag : tags){
            result.add(tag.getName());
        }
        return result;
    }
}
