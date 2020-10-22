class SJCC_User {
  profile = {};
  userdata = {};

  constructor(userinfo) {
    if (! userinfo) {
      return this;
    }

    if (userinfo.profile) {
      this.profile.email = userinfo.profile.email || "";

      this.profile.firstName = userinfo.profile.firstName || "";
      this.profile.lastName = userinfo.profile.lastName || "";
      this.profile.fullName = userinfo.profile.fullName || "";

      this.profile.attributes = userinfo.profile.attributes || {};
    }

    if (userinfo.userdata) {
      this.userdata = userinfo.userdata;
    }

    return this;
  }

  toJson() {
    return {
      profile: this.profile,
      userdata: this.userdata
    }
  }

  /**
   * Retrieve a attribute from profile
   *
   * @param  {string} attribute
   * @return {string}
   */
  getAttributeValue(attribute) {
    const values = this.profile.attributes[attribute] || '';

    return (typeof values === 'string') ? values : values[0];
  }

  /**
   * Get user email
   *
   * @return {string}
   */
  getEmail() {
    return this.profile.email;
  }

  /**
   * Get first name
   *
   * @return {string}
   */
  getFirstName() {
    return this.profile.firstName;
  }

  /**
   * Get last name
   *
   * @return {string}
   */
  getLastName() {
    return this.profile.lastName;
  }

  /**
   * Get user fullname.
   *
   * @return {string}
   */
  getFullname() {
    return this.profile.fullName;
  }

  /**
   * Get user avatar.
   * Will try from attribute and from Facebook default avatar.
   *
   * @return {string}
   */
  getAvatar() {
    const avatar = this.getAttributeValue('avatar');
    if (avatar) {
      return avatar;
    }

    const facebookId = this.getAttributeValue('facebook_id');
    if (facebookId) {
      return `https://graph.facebook.com/${facebookId}/picture`;
    }

    return '';
  }
}

export default SJCC_User;
