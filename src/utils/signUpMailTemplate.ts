export const signUpMailTemplate = (
  username: string,
) => `<div style="font-family: Arial, Helvetica, sans-serif; background-color: #0f0f0f; padding: 32px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #161616; border-radius: 12px; padding: 32px; color: #ffffff;">
        
        <h1 style="margin-top: 0; font-size: 28px; font-weight: 600;">
          Welcome to <span style="color: #FF4500;">Verb</span>, ${username}
        </h1>

        <p style="font-size: 16px; line-height: 1.6; color: #cccccc;">
          Verb is your writing space for technical ideas — built for people who think,
          build, document, and share.
        </p>

        <p style="font-size: 15px; line-height: 1.6; color: #cccccc;">
          Here’s what you can do on Verb:
        </p>

        <ul style="padding-left: 20px; color: #cccccc; font-size: 15px; line-height: 1.6;">
          <li>✍️ Write and publish tech blogs</li>
          <li>🧠 Document learnings, tutorials, and experiments</li>
          <li>📚 Build your personal knowledge stack</li>
          <li>🚀 Share ideas without noise or clutter</li>
        </ul>

        <div style="margin: 32px 0; text-align: center;">
          <a
            href="https://verbblog.netlify.app/blog-post"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #FF4500;
              color: #000000;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 15px;
            "
          >
            Write your first blog →
          </a>
        </div>

        <p style="font-size: 14px; color: #999999; line-height: 1.6;">
          If you ever feel stuck, just start writing. You can always refine later.
        </p>

        <p style="font-size: 14px; color: #999999; margin-bottom: 0;">
          — The Verb Team
        </p>
      </div>
    </div>
  `;
