CREATE OR REPLACE FUNCTION get_trending_freelancers(limit_count INT)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  title TEXT,
  average_rating NUMERIC,
  review_count BIGINT,
  skills TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.title,
    COALESCE(AVG(r.rating), 0) AS average_rating,
    COUNT(r.id) AS review_count,
    (SELECT STRING_AGG(s.name, ', ')
     FROM skills s
     JOIN freelancer_skills fs ON s.id = fs.skill_id
     WHERE fs.user_id = p.user_id
    ) AS skills
  FROM
    profiles p
  LEFT JOIN
    freelancer_post_reviews r ON p.user_id = r.freelancer_id
  WHERE
    p.role = 'freelancer'
  GROUP BY
    p.user_id
  ORDER BY
    average_rating DESC, review_count DESC
  LIMIT
    limit_count;
END;
$$;
