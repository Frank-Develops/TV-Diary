import React from 'react';

class DeleteModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = { modalOpen: true };
    this.deleteFromWatchlist = this.deleteFromWatchlist.bind(this);
    this.deleteFromDiary = this.deleteFromDiary.bind(this);
  }

  render() {
    if (this.state.modalOpen === false) {
      return <div className="hidden">
      </div>;
    } else if (this.props.deleteDiary === 'true') {
      return <div className="modal-container">
        <div className="delete-modal">
          <h2>Are you sure you want to delete this episode from your Diary?</h2>
          <div className="delete-modal-buttons">
            <button onClick={this.deleteFromDiary} id={this.props.episodeToDelete} type="submit">Yes</button>
            <button onClick={this.props.toggleModal} type="button">No</button>
          </div>
        </div>
      </div >;
    } else {
      return <div className="modal-container">
        <div className="delete-modal">
          <h2>Are you sure you want to delete this episode from your watchlist?</h2>
          <div className="delete-modal-buttons">
            <button onClick={this.deleteFromWatchlist} id={this.props.episodeToDelete} type="submit">Yes</button>
            <button onClick={this.props.toggleModal} type="button">No</button>
          </div>
        </div>
      </div >;
    }
  }

  deleteFromDiary(event) {
    this.setState({ modalOpen: false });
    const deleteId = event.target.getAttribute('id');
    this.props.deleteFromLog(deleteId);
    this.props.toggleModal();
  }

  deleteFromWatchlist(event) {
    this.setState({ modalOpen: false });
    const deleteId = event.target.getAttribute('id');
    this.props.deleteFromWatchlist(deleteId);
    this.props.toggleModal();
  }

}

export default DeleteModal;
