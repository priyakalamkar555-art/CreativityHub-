function scrollToAbout() {
    const aboutSection = document.getElementById("about");
    aboutSection.scrollIntoView({ behavior: "smooth"});
    aboutSection.style.backgroundColor = "#fff0f5";
    setTimeout(() => {
        aboutSection.style.backgroundColor = "";
    },1500);
}

function scrollToHome() {
    const homeSection = document.getElementById("home");
    homeSection.scrollIntoView({ behavior: "smooth"});
    homeSection.style.backgroundColor = "#fff0f5";
    setTimeout(() => {
        homeSection.style.backgroundColor = "";
    },1500);
}

let currentPostId = '';
  let currentUserId = '<%= userId %>';
  let currentUserName = '<%= userName %>';

  function openModal(element) {
    const postId = element.dataset.id;
    const imageSrc = element.dataset.url;
    const likeCount = element.dataset.likes;
    const commentsStr = element.dataset.comments;
    const ownerId = element.dataset.owner;

    currentPostId = postId;
    document.getElementById("imageModal").style.display = "block";
    document.getElementById("modalImage").src = imageSrc;
    document.getElementById("downloadBtn").href = imageSrc;
    document.getElementById("likeCount").textContent = likeCount;
    document.getElementById("likeForm").action = `/creativity_hub/like/${postId}`;
    document.getElementById("commentForm").action = `/creativity_hub/comment/${postId}`;
    document.getElementById("deleteForm").action = `/creativity_hub/delete/${postId}`;
    
    // Display comments
    const comments = JSON.parse(commentsStr);
    const commentsList = document.getElementById("commentsList");
    commentsList.innerHTML = '';
    comments.forEach(comment => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>${comment.user.username}:</strong> ${comment.text}`;
      commentsList.appendChild(div);
    });

    // Show edit/delete if owner
    const editBtn = document.getElementById("editBtn");
    const deleteForm = document.getElementById("deleteForm");
    if (currentUserId && ownerId === currentUserId) {
      editBtn.style.display = "inline";
      deleteForm.style.display = "inline";
    } else {
      // editBtn.style.display = "none";
      // deleteForm.style.display = "none";
    }
  }

  function closeModal() {
    document.getElementById("imageModal").style.display = "none";
    document.getElementById("commentSection").style.display = "none";
  }

  function toggleComment() {
    const section = document.getElementById("commentSection");
    section.style.display = section.style.display === "none" ? "block" : "none";
  }

  function shareImage() {
    const imageSrc = document.getElementById("modalImage").src;
    navigator.clipboard.writeText(imageSrc).then(() => {
      alert('Image link copied to clipboard!');
    });
  }

  function editPost() {
    window.location.href = `/creativity_hub/edit/${currentPostId}`;
  }

  // AJAX for comment posting
  document.getElementById('commentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const commentText = formData.get('comment');
    if (!commentText.trim()) return;

    const response = await fetch(this.action, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = await response.json();
    if (data.success) {
      // Add the new comment to the list
      const commentsList = document.getElementById('commentsList');
      const newComment = document.createElement('div');
      newComment.innerHTML = `<strong>${currentUserName}:</strong> ${commentText}`;
      commentsList.appendChild(newComment);
      // Clear the input
      this.comment.value = '';
      // Scroll to bottom
      commentsList.scrollTop = commentsList.scrollHeight;
    } else {
      alert(data.message || 'Failed to post comment');
    }
  });
