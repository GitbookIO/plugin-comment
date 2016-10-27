const GitBook = require('gitbook-core');
const { React, Tooltipped } = GitBook;

const AvatarsIcon = React.createClass({
    propTypes: {
        users:     React.PropTypes.array.isRequired,
        openArea:  React.PropTypes.number,
        sectionId: React.PropTypes.number.isRequired
    },

    render() {
        const { users, openArea, sectionId } = this.props;
        const displayedUsers = users.slice(0, 3);

        const usernames = displayedUsers.map(user => user.username).join(', ');
        const countOthers = users.length - displayedUsers.length;

        const tooltipTitle = `${usernames} ${countOthers > 0 ? `and ${countOthers} other people` : ''}`;

        if (!openArea || (openArea != sectionId)) {
            return (
                <div className="Comment-Avatars">
                    <Tooltipped title={tooltipTitle}>
                        {displayedUsers.reverse().map((user, i) => {
                            return (
                                <div key={i} className="Comment-Avatar">
                                    <img src={user.urls.avatar} />
                                </div>
                            );
                        })}
                    </Tooltipped>
                </div>
            );
        }
        else {
            return (
                <div className="Comment-Avatars">
                    {displayedUsers.reverse().map((user, i) => {
                        return (
                            <div key={i} className="Comment-Avatar">
                                <img src={user.urls.avatar} />
                            </div>
                        );
                    })}
                </div>
            );
        }
    }
});

function mapStateToProps({ comment }) {
    return {
        openArea: comment.get('openArea')
    };
}

module.exports = GitBook.connect(AvatarsIcon, mapStateToProps);
