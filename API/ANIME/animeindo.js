const url = require("../helpers/base-url");
const { default: Axios } = require("axios");
const cheerio = require("cheerio");
const errors = require("../helpers/errors");
const episodeHelper = require("../helpers/episodeHelper");
const {baseUrl} = require("../helpers/base-url");
const e = require("express");

exports.detailAnime = async (req, res) => {
  const id = req.params.id;
  const fullUrl = url.baseUrl + `anime/${id}`;
  // console.log(fullUrl);
  try {
    const response = await Axios.get(fullUrl);

    const $ = cheerio.load(response.data);
    const detailElement = $(".venser").find(".fotoanime");
    const epsElement = $("#_epslist").html();
    let object = {};
    let episode_list = [];
    object.thumb = detailElement.find("img").attr("src");
    object.anime_id = req.params.id;
    let genre_name, genre_id, genre_link;
    let genreList = [];

    object.synopsis = $("#venkonten > div.venser > div.fotoanime > div.sinopc")
      .find("p")
      .text();

    detailElement.find(".infozin").filter(function () {
      object.title = $(this)
        .find("p")
        .children()
        .eq(0)
        .text()
        .replace("Judul: ", "");
      object.japanase = $(this)
        .find("p")
        .children()
        .eq(1)
        .text()
        .replace("Japanese: ", "");
      object.score = parseFloat(
        $(this).find("p").children().eq(2).text().replace("Skor: ", "")
      );
      object.producer = $(this)
        .find("p")
        .children()
        .eq(3)
        .text()
        .replace("Produser:  ", "");
      object.type = $(this)
        .find("p")
        .children()
        .eq(4)
        .text()
        .replace("Tipe: ", "");
      object.status = $(this)
        .find("p")
        .children()
        .eq(5)
        .text()
        .replace("Status: ", "");
      object.total_episode = parseInt(
        $(this).find("p").children().eq(6).text().replace("Total Episode: ", "")
      );
      object.duration = $(this)
        .find("p")
        .children()
        .eq(7)
        .text()
        .replace("Durasi: ", "");
      object.release_date = $(this)
        .find("p")
        .children()
        .eq(8)
        .text()
        .replace("Tanggal Rilis: ", "");
      object.studio = $(this)
        .find("p")
        .children()
        .eq(9)
        .text()
        .replace("Studio: ", "");
      $(this)
        .find("p")
        .children()
        .eq(10)
        .find("span > a")
        .each(function () {
          genre_name = $(this).text();
          genre_id = $(this)
            .attr("href")
            .replace(`https://otakudesu.moe/genres/`, "");
          genre_link = $(this).attr("href");
          genreList.push({ genre_name, genre_id, genre_link });
          object.genre_list = genreList;
        });
    });

    $("#venkonten > div.venser > div:nth-child(8) > ul > li").each(
      (i, element) => {
        const dataList = {
          title: $(element).find("span > a").text(),
          id: $(element)
            .find("span > a")
            .attr("href")
            .replace('https://otakudesu.moe/', ""),
          link: $(element).find("span > a").attr("href"),
          uploaded_on: $(element).find(".zeebr").text(),
        };
        episode_list.push(dataList);
      }
    );
    object.episode_list =
      episode_list.length === 0
        ? [
            {
              title: "Masih kosong gan",
              id: "Masih kosong gan",
              link: "Masih kosong gan",
              uploaded_on: "Masih kosong gan",
            },
          ]
        : episode_list;
    const batch_link = {
      id:
        $("div.venser > div:nth-child(6) > ul").text().length !== 0
          ? $("div.venser > div:nth-child(6) > ul > li > span:nth-child(1) > a")
              .attr("href")
              .replace(`https://otakudesu.moe/batch/`, "")
          : "Masih kosong gan",
      link:
        $("div.venser > div:nth-child(6) > ul").text().length !== 0
          ? $(
              "div.venser > div:nth-child(6) > ul > li > span:nth-child(1) > a"
            ).attr("href")
          : "Masih kosong gan",
    };
    const empty_link = {
      id: "Masih kosong gan",
      link: "Masih kosong gan",
    };
    object.batch_link = batch_link;
    //console.log(epsElement);
    res.json(object);
  } catch (err) {
    console.log(err);
    errors.requestFailed(req, res, err);
  }
};
exports.batchAnime = async (req, res) => {
  const id = req.params.id;
  const fullUrl = `${baseUrl}batch/${id}`;
  console.log(fullUrl);
  Axios.get(fullUrl)
    .then((response) => {
      const $ = cheerio.load(response.data);
      const obj = {};
      obj.title = $(".batchlink > h4").text();
      obj.status = "success";
      obj.baseUrl = fullUrl;
      let low_quality = _batchQualityFunction(0, response.data);
      let medium_quality = _batchQualityFunction(1, response.data);
      let high_quality = _batchQualityFunction(2, response.data);
      obj.download_list = { low_quality, medium_quality, high_quality };
      res.send(obj);
    })
    .catch((err) => {
      errors.requestFailed(req, res, err);
    });
};
exports.epsAnime = async (req, res) => {
  const id = req.params.id;
  const fullUrl = `${url.baseUrl}${id}`;
  try {
    const response = await Axios.get(fullUrl);
    const $ = cheerio.load(response.data);
    const streamElement = $("#lightsVideo").find("#embed_holder");
    const obj = {};
    obj.title = $(".venutama > h1").text();
    obj.baseUrl = fullUrl;
    obj.id = fullUrl.replace(url.baseUrl, "");
    const streamLink = streamElement.find("iframe").attr("src");
    // const streamLinkResponse = await Axios.get(streamLink)
    // const stream$ = cheerio.load(streamLinkResponse.data)
    // const sl = stream$('body').find('script').html().search('sources')
    // const endIndex = stream$('body').find('script').eq(0).html().indexOf('}]',sl)
    // const val = stream$('body').find('script').eq(0).html().substr(sl,endIndex - sl+1).replace(`sources: [{'file':'`,'')
    // console.log(val);
    // console.log(val.replace(`','type':'video/mp4'}`,''));
    obj.link_stream = await episodeHelper.get(streamLink);
    console.log($('#pembed > div > iframe').attr('src'));
    let low_quality;
    let medium_quality;
    let high_quality;
    let mirror1 = [];
    let mirror2 = [];
    let mirror3 = [];

    $('#embed_holder > div.mirrorstream > ul.m360p > li').each((idx,el)=>{``
      mirror1.push({
        host:$(el).find('a').text().trim(),
        id:$(el).find('a').attr('href'),
      });
    });
    $('#embed_holder > div.mirrorstream > ul.m480p > li').each((idx,el)=>{
      mirror2.push({
        host:$(el).find('a').text().trim(),
        id:$(el).find('a').attr('href'),
      });
    });
    $('#embed_holder > div.mirrorstream > ul.m720p > li').each((idx,el)=>{
      mirror3.push({
        host:$(el).find('a').text().trim(),
        id:$(el).find('a').attr('href'),
      });
    });
    obj.mirror1 = {quality:'360p',mirrorList:mirror1}
    obj.mirror2 = {quality:'480p',mirrorList:mirror2}
    obj.mirror3 = {quality:'720p',mirrorList:mirror3}
    if($('#venkonten > div.venser > div.venutama > div.download > ul > li:nth-child(1)').text() === ''){
      console.log('ul is empty');
      low_quality = _notFoundQualityHandler(response.data,0)
      medium_quality = _notFoundQualityHandler(response.data,1)
      high_quality = _notFoundQualityHandler(response.data,2)
    }else{
      console.log('ul is not empty');
      low_quality = _epsQualityFunction(0, response.data);
      medium_quality = _epsQualityFunction(1, response.data);
      high_quality = _epsQualityFunction(2, response.data);
    }
    obj.quality = { low_quality, medium_quality, high_quality };
    res.send(obj);
  } catch (err) {
    console.log(err);
    errors.requestFailed(req, res, err);
  }
};

exports.epsMirror = async (req, res) => {
  const mirrorId = req.body.mirrorId;
  const animeId = req.params.animeId;
  const fullUrl = `${baseUrl}${animeId}/${mirrorId}`;
  try {
    const response = await Axios.get(fullUrl);
    const $ = cheerio.load(response.data);
    const obj = {};
    obj.title = $(".venutama > h1").text();
    obj.baseUrl = fullUrl;
    obj.id = fullUrl.replace(url.baseUrl, "");
    const streamLink = $('#pembed > div > iframe').attr('src')
    obj.streamLink = streamLink
    obj.link_stream = await episodeHelper.get(streamLink);
    res.send(obj);
  } catch (error) {
    console.log(error);
    errors.requestFailed(req, res, err);
  }
}

function _batchQualityFunction(num, res) {
  const $ = cheerio.load(res);
  const element = $(".download").find(".batchlink");
  const download_links = [];
  let response;
  element.find("ul").filter(function () {
    const quality = $(this).find("li").eq(num).find("strong").text();
    const size = $(this).find("li").eq(num).find("i").text();
    $(this)
      .find("li")
      .eq(num)
      .find("a")
      .each(function () {
        const _list = {
          host: $(this).text(),
          link: $(this).attr("href"),
        };
        download_links.push(_list);
        response = { quality, size, download_links };
      });
  });
  return response;
}
function _epsQualityFunction(num, res) {
  const $ = cheerio.load(res);
  const element = $(".download");
  const download_links = [];
  let response;

  element.find("ul").filter(function () {
    const quality = $(this).find("li").eq(num).find("strong").text();
    const size = $(this).find("li").eq(num).find("i").text();
    $(this).find("li").eq(num).find("a").each(function () {
        const _list = {
          host: $(this).text(),
          link: $(this).attr("href"),
        };
        download_links.push(_list);
        response = { quality, size, download_links };
        
      });
  });
  return response;
}

function _notFoundQualityHandler(res,num){
  const $ = cheerio.load(res);
  const download_links = [];
  const element = $('.download')
  let response;

  element.filter(function(){
    if($(this).find('.anime-box > .anime-title').eq(0).text() === ''){
      $(this).find('.yondarkness-box').filter(function(){
        const quality = $(this).find('.yondarkness-title').eq(num).text().split('[')[1].split(']')[0];
        const size = $(this).find('.yondarkness-title').eq(num).text().split(']')[1].split('[')[1];
        $(this).find('.yondarkness-item').eq(num).find('a').each((idx,el) => {
          const _list = {
            host: $(el).text(),
            link: $(el).attr("href"),
          };
          download_links.push(_list);
          response = { quality, size, download_links };
        })
      })
    }else{
      $(this).find('.anime-box').filter(function(){
        const quality = $(this).find('.anime-title').eq(num).text().split('[')[1].split(']')[0];
        const size = $(this).find('.anime-title').eq(num).text().split(']')[1].split('[')[1];
        $(this).find('.anime-item').eq(num).find('a').each((idx,el) => {
          const _list = {
            host: $(el).text(),
            link: $(el).attr("href"),
          };
          download_links.push(_list);
          response = { quality, size, download_links };
        })
      })
    }
  })
  return response;

}
        return User(
            _api=self,
            _id=user["id"],
            _username=user.get("username"),
            _created_at=datetime.datetime.fromisoformat(
                user["createdAt"].replace("Z", "+00:00")
            ),
            _favorites=[Image(_api=self, _id=id) for id in user.get("favorites", [])],
            _favorites_received=user.get("favoritesReceived"),
            _likes=[Image(_api=self, _id=id) for id in user.get("likes", [])],
            _likes_received=user.get("likesReceived"),
            _roles=user.get("roles"),
            _saved_tags=user.get("savedTags"),
            _uploads=user.get("uploads"),
        )

    def search_users(
        self, query: str, limit: int = 20, offset: int = 0
    ) -> typing.List[User]:
        """
        Search for a user.
        """

        response = requests.post(
            f"{self.endpoint}/users/search",
            headers={"Authorization": self.api_token} if self.api_token else None,
            data={"query": query, "limit": limit, "offset": offset},
        )

        if response.status_code != 200:
            raise exceptions.ServerError(
                status_code=response.status_code,
                msg=response.json().get("message", "Unknown error"),
            )

        return [
            User(
                _api=self,
                _id=user["id"],
                _username=user.get("username"),
                _created_at=datetime.datetime.fromisoformat(
                    user["createdAt"].replace("Z", "+00:00")
                )
                if user.get("createdAt")
                else None,
                _favorites=[
                    Image(_api=self, _id=id) for id in user.get("favorites", [])
                ],
                _favorites_received=user.get("favoritesReceived"),
                _likes=[Image(_api=self, _id=id) for id in user.get("likes", [])],
                _likes_received=user.get("likesReceived"),
                _roles=user.get("roles"),
                _saved_tags=user.get("savedTags"),
                _uploads=user.get("uploads"),
            )
            for user in response.json()["users"]
        ]

    def get_image(self, image_id: str) -> Image:
        """
        Get information about an image.
        """

        response = requests.get(
            f"{self.endpoint}/images/{image_id}",
            headers={"Authorization": self.api_token} if self.api_token else None,
        )

        if response.status_code != 200:
            raise exceptions.ServerError(
                status_code=response.status_code,
                msg=response.json().get("message", "Unknown error"),
            )

        image = response.json()["image"]

        return Image(
            _api=self,
            _id=image["id"],
            _created_at=datetime.datetime.fromisoformat(
                image["createdAt"].replace("Z", "+00:00")
            ),
            _tags=image["tags"],
            _uploader=User(
                _api=self,
                _id=image["uploader"]["id"],
                _username=image["uploader"]["username"],
            ),
            _approver=User(
                _api=self,
                _id=image["approver"]["id"],
                _username=image["approver"]["username"],
            )
            if "approver" in image
            else None,
            _favorites=image["favorites"],
            _likes=image["likes"],
        )

    def search_images(
        self,
        nsfw: typing.Optional[bool] = None,
        uploader: typing.Optional[str] = None,
        artist: typing.Optional[str] = None,
        tags: typing.Optional[typing.List[str]] = None,
        sort: typing.Optional[SearchSort] = None,
        posted_before: typing.Optional[datetime.datetime] = None,
        posted_after: typing.Optional[datetime.datetime] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> typing.List[Image]:
        """
        Search for images.
        """

        params = {}

        if nsfw is not None:
            params["nsfw"] = nsfw

        if uploader:
            params["uploader"] = uploader

        if artist:
            params["artist"] = artist

        if tags:
            params["tags"] = tags

        if sort:
            params["sort"] = sort.value

        if posted_before:
            params["posted_before"] = posted_before.timestamp() * 1000

        if posted_after:
            params["posted_after"] = posted_after.timestamp() * 1000

        if limit:
            if limit > 50 or limit < 1:
                raise ValueError("Limit must be between 1 and 50.")
            params["limit"] = limit

        if offset:
            if offset < 0 or offset > 2500:
                raise ValueError("Offset must be between 0 and 2500.")
            params["offset"] = offset

        response = requests.post(
            f"{self.endpoint}/images/search",
            data=json.dumps(params),
            headers={"Authorization": self.api_token} if self.api_token else None,
        )

        if response.status_code != 200:
            raise exceptions.ServerError(
                status_code=response.status_code,
                msg=response.json().get("message", "Unknown error"),
            )

        images = response.json()["images"]

        return [
            Image(
                _api=self,
                _id=image["id"],
                _nsfw=image["nsfw"],
                _tags=image["tags"],
                _likes=image["likes"],
                _favorites=image["favorites"],
                _uploader=User(
                    _api=self,
                    _id=image["uploader"]["id"],
                    _username=image["uploader"]["username"],
                ),
                _approver=User(
                    _api=self,
                    _id=image["approver"]["id"],
                    _username=image["approver"]["username"],
                )
                if "approver" in image
                else None,
                _created_at=datetime.datetime.fromisoformat(
                    image["createdAt"].replace("Z", "+00:00")
                ),
            )
            for image in images
        ]

    def get_random_images(self, count: int) -> typing.List[Image]:
        """
        Get random images.
        """

        response = requests.get(
            f"{self.endpoint}/random/image",
            headers={"Authorization": self.api_token} if self.api_token else None,
            params={"count": count},
        )

        if response.status_code != 200:
            raise exceptions.ServerError(
                status_code=response.status_code,
                msg=response.json().get("message", "Unknown error"),
            )

        return [
            Image(
                _api=self,
                _id=image.get("id"),
                _nsfw=image.get("nsfw"),
                _tags=image.get("tags"),
                _likes=image.get("likes"),
                _favorites=image.get("favorites"),
                _uploader=User(
                    _api=self,
                    _id=image["uploader"]["id"],
                    _username=image["uploader"]["username"],
                ),
                _approver=User(
                    _api=self,
                    _id=image["approver"]["id"],
                    _username=image["approver"]["username"],
                )
                if "approver" in image
                else None,
                _created_at=datetime.datetime.fromisoformat(
                    image["createdAt"].replace("Z", "+00:00")
                ),
            )
            for image in response.json()["images"]
        ]

    def upload_image(
        self,
        image: typing.Union[str, bytes],
        nsfw: bool,
        artist: str,
        tags: typing.List[str],
    ) -> PendingImage:
        """
        Upload an image.
        """

        if isinstance(image, str):
            with open(image, "rb") as file:
                image = file.read()

        response = requests.post(
            f"{self.endpoint}/images",
            files={"image": image},
            data={"nsfw": nsfw, "artist": artist, "tags": tags},
            headers={"Authorization": self.api_token} if self.api_token else None,
        )

        if response.status_code != 200:
            raise exceptions.ServerError(
                status_code=response.status_code,
                msg=response.json().get("message", "Unknown error"),
            )

        image_urls = response.json()

        return PendingImage(
            image=Image(
                _api=self,
                _id=image_urls["image"].get("id"),
                _nsfw=image_urls["image"].get("nsfw"),
                _tags=image_urls["image"].get("tags"),
                _likes=image_urls["image"].get("likes"),
                _favorites=image_urls["image"].get("favorites"),
                _uploader=User(
                    _api=self,
                    _id=image_urls["image"].get("uploader", {}).get("id", None),
                    _username=image_urls["image"]
                    .get("uploader", {})
                    .get("username", None),
                ),
                _approver=User(
                    _api=self,
                    _id=image_urls["image"].get("approver", {}).get("id", None),
                    _username=image_urls["image"]
                    .get("approver", {})
                    .get("username", None),
                )
                if "approver" in image_urls["image"]
                else None,
                _created_at=datetime.datetime.fromisoformat(
                    image_urls["image"].get("createdAt", None).replace("Z", "+00:00")
                )
                if image_urls["image"].get("createdAt", None)
                else None,
                _pending=True,
            ),
            image_url=image_urls["image_url"],
            post_url=image_urls["post_url"],
